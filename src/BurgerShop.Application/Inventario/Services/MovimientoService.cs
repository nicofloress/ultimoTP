using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Inventario;

namespace BurgerShop.Application.Inventario.Services;

public class MovimientoService : IMovimientoService
{
    private readonly IMovimientoRepository      _movRepo;
    private readonly IArtiStockRepository       _stockRepo;
    private readonly IRepository<CodigoAccion>  _codigoRepo;
    private readonly IPedidoRepository          _pedidoRepo;
    private readonly IComboRepository           _comboRepo;

    public MovimientoService(
        IMovimientoRepository     movRepo,
        IArtiStockRepository      stockRepo,
        IRepository<CodigoAccion> codigoRepo,
        IPedidoRepository         pedidoRepo,
        IComboRepository          comboRepo)
    {
        _movRepo    = movRepo;
        _stockRepo  = stockRepo;
        _codigoRepo = codigoRepo;
        _pedidoRepo = pedidoRepo;
        _comboRepo  = comboRepo;
    }

    // ----------------------------------------------------------------
    // Registrar un movimiento manual
    // ----------------------------------------------------------------
    public async Task<MovimientoDto> RegistrarMovimientoAsync(CrearMovimientoDto dto, int? usuarioId)
    {
        if (dto.FechaMovimiento.Date > DateTime.Today)
            throw new InvalidOperationException("La fecha del movimiento no puede ser futura.");

        var codigo = await _codigoRepo.GetByIdAsync(dto.CodigoAccionId)
            ?? throw new InvalidOperationException($"Código de acción {dto.CodigoAccionId} no encontrado.");

        if (!codigo.Activo)
            throw new InvalidOperationException($"El código de acción '{codigo.Codigo}' no está activo.");

        var movimiento = new Movimiento
        {
            FechaMovimiento = dto.FechaMovimiento,
            FechaProceso    = DateTime.Now,
            CodigoAccionId  = dto.CodigoAccionId,
            ProductoId      = dto.ProductoId,
            LocalId         = dto.LocalId,
            Cantidad        = dto.Cantidad,
            PrecioUnitario  = dto.PrecioUnitario,
            MontoTotal      = dto.Cantidad * dto.PrecioUnitario,
            UsuarioId       = usuarioId,
            Observaciones   = dto.Observaciones
        };

        await _movRepo.AddAsync(movimiento);
        await _movRepo.SaveChangesAsync();

        // Actualizar stock si el código lo requiere y hay producto
        if ((codigo.TipoAfectacion == TipoAfectacion.Stock ||
             codigo.TipoAfectacion == TipoAfectacion.Ambos)
            && dto.ProductoId.HasValue)
        {
            await ActualizarArtiStockAsync(dto.ProductoId.Value, dto.LocalId, dto.Cantidad, codigo);
        }

        return ToDto(movimiento, codigo);
    }

    // ----------------------------------------------------------------
    // Registrar movimientos automáticos al confirmar una venta
    // ----------------------------------------------------------------
    public async Task<IEnumerable<MovimientoDto>> RegistrarMovimientosVentaAsync(
        int pedidoId, int localId, int? usuarioId)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId)
            ?? throw new InvalidOperationException($"Pedido {pedidoId} no encontrado.");

        var codigoEgr = await _codigoRepo.GetByIdAsync(1)  // EGR_VTA
            ?? throw new InvalidOperationException("Código EGR_VTA (Id=1) no encontrado en la base de datos.");
        var codigoIng = await _codigoRepo.GetByIdAsync(2)  // ING_VTA
            ?? throw new InvalidOperationException("Código ING_VTA (Id=2) no encontrado en la base de datos.");

        var movimientos = new List<(Movimiento Movimiento, CodigoAccion Codigo)>();
        var ahora       = DateTime.Now;
        var hoy         = ahora.Date;

        // Un movimiento EGR_VTA por cada producto o componente de combo
        foreach (var linea in pedido.Lineas)
        {
            if (linea.ProductoId.HasValue)
            {
                // Producto suelto
                var mov = CrearEgrVta(linea.ProductoId.Value, localId,
                    linea.Cantidad, linea.PrecioUnitario, linea.Subtotal,
                    pedidoId, usuarioId, ahora, ahora);

                movimientos.Add((mov, codigoEgr));
                await ActualizarArtiStockVentaAsync(linea.ProductoId.Value, localId, linea.Cantidad);
            }
            else if (linea.ComboId.HasValue)
            {
                var combo = await _comboRepo.GetByIdWithDetallesAsync(linea.ComboId.Value);
                // 1 solo movimiento con el nombre del combo
                var mov = new Movimiento
                {
                    FechaMovimiento = ahora,
                    FechaProceso    = ahora,
                    CodigoAccionId  = codigoEgr.Id,
                    ProductoId      = null,
                    LocalId         = localId,
                    Cantidad        = linea.Cantidad,
                    PrecioUnitario  = linea.PrecioUnitario,
                    MontoTotal      = linea.Subtotal,
                    PedidoId        = pedidoId,
                    UsuarioId       = usuarioId,
                    Observaciones   = combo?.Nombre ?? $"Combo #{linea.ComboId}"
                };
                movimientos.Add((mov, codigoEgr));

                // Actualizar stock de cada producto componente
                if (combo?.Detalles != null)
                {
                    foreach (var detalle in combo.Detalles)
                    {
                        var cantidadTotal = linea.Cantidad * detalle.Cantidad;
                        await ActualizarArtiStockVentaAsync(detalle.ProductoId, localId, cantidadTotal);
                    }
                }
            }
        }

        // Un movimiento ING_VTA por el total del pedido (ingreso de caja)
        var movIngreso = new Movimiento
        {
            FechaMovimiento = ahora,
            FechaProceso    = ahora,
            CodigoAccionId  = codigoIng.Id,
            ProductoId      = null,
            LocalId         = localId,
            Cantidad        = 1,
            PrecioUnitario  = pedido.Total,
            MontoTotal      = pedido.Total,
            PedidoId        = pedidoId,
            UsuarioId       = usuarioId
        };
        movimientos.Add((movIngreso, codigoIng));

        // Persistir todos en bloque
        foreach (var (mov, _) in movimientos)
            await _movRepo.AddAsync(mov);

        await _movRepo.SaveChangesAsync();
        await _stockRepo.SaveChangesAsync();

        return movimientos.Select(t => ToDto(t.Movimiento, t.Codigo));
    }

    // ----------------------------------------------------------------
    // Solo movimientos de STOCK (EGR_VTA) — al finalizar reparto
    // ----------------------------------------------------------------
    public async Task RegistrarMovimientosVentaStockAsync(int pedidoId, int localId, int? usuarioId)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        if (pedido is null) return;

        var codigoEgr = await _codigoRepo.GetByIdAsync(1); // EGR_VTA
        if (codigoEgr is null) return;

        var ahora = DateTime.Now;
        var hoy = ahora.Date;

        foreach (var linea in pedido.Lineas)
        {
            if (linea.ProductoId.HasValue)
            {
                var mov = CrearEgrVta(linea.ProductoId.Value, localId,
                    linea.Cantidad, linea.PrecioUnitario, linea.Subtotal,
                    pedidoId, usuarioId, ahora, ahora);
                await _movRepo.AddAsync(mov);
                await ActualizarArtiStockVentaAsync(linea.ProductoId.Value, localId, linea.Cantidad);
            }
            else if (linea.ComboId.HasValue)
            {
                var combo = await _comboRepo.GetByIdWithDetallesAsync(linea.ComboId.Value);
                // 1 solo movimiento con el nombre del combo
                var mov = new Movimiento
                {
                    FechaMovimiento = ahora,
                    FechaProceso    = ahora,
                    CodigoAccionId  = 1, // EGR_VTA
                    ProductoId      = null,
                    LocalId         = localId,
                    Cantidad        = linea.Cantidad,
                    PrecioUnitario  = linea.PrecioUnitario,
                    MontoTotal      = linea.Subtotal,
                    PedidoId        = pedidoId,
                    UsuarioId       = usuarioId,
                    Observaciones   = combo?.Nombre ?? $"Combo #{linea.ComboId}"
                };
                await _movRepo.AddAsync(mov);

                // Actualizar stock de cada producto componente
                if (combo?.Detalles != null)
                {
                    foreach (var detalle in combo.Detalles)
                    {
                        var cantidadTotal = linea.Cantidad * detalle.Cantidad;
                        await ActualizarArtiStockVentaAsync(detalle.ProductoId, localId, cantidadTotal);
                    }
                }
            }
        }

        await _movRepo.SaveChangesAsync();
        await _stockRepo.SaveChangesAsync();
    }

    // ----------------------------------------------------------------
    // Solo movimiento de CAJA (ING_VTA) — al aprobar rendición
    // ----------------------------------------------------------------
    public async Task RegistrarMovimientosVentaCajaAsync(int pedidoId, int localId, int? usuarioId)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        if (pedido is null) return;

        var codigoIng = await _codigoRepo.GetByIdAsync(2); // ING_VTA
        if (codigoIng is null) return;

        var ahora = DateTime.Now;

        var movIngreso = new Movimiento
        {
            FechaMovimiento = ahora.Date,
            FechaProceso    = ahora,
            CodigoAccionId  = codigoIng.Id,
            ProductoId      = null,
            LocalId         = localId,
            Cantidad        = 1,
            PrecioUnitario  = pedido.Total,
            MontoTotal      = pedido.Total,
            PedidoId        = pedidoId,
            UsuarioId       = usuarioId
        };

        await _movRepo.AddAsync(movIngreso);
        await _movRepo.SaveChangesAsync();
    }

    // ----------------------------------------------------------------
    // Anular todos los movimientos de un pedido
    // ----------------------------------------------------------------
    public async Task AnularMovimientosVentaAsync(int pedidoId, int? usuarioId)
    {
        var originales = await _movRepo.GetByPedidoAsync(pedidoId);
        var ahora      = DateTime.Now;
        var hoy        = ahora.Date;

        foreach (var orig in originales)
        {
            // Código inverso: mismo TipoAfectacion, signo opuesto
            var codigosInversos = await _codigoRepo.FindAsync(
                c => c.Activo
                     && c.TipoAfectacion == orig.CodigoAccion.TipoAfectacion
                     && c.Signo == orig.CodigoAccion.Signo * -1);

            var codigoInverso = codigosInversos.FirstOrDefault() ?? orig.CodigoAccion;

            var anulacion = new Movimiento
            {
                FechaMovimiento = ahora,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoInverso.Id,
                ProductoId      = orig.ProductoId,
                LocalId         = orig.LocalId,
                Cantidad        = orig.Cantidad,
                PrecioUnitario  = orig.PrecioUnitario,
                MontoTotal      = orig.MontoTotal * -1,
                PedidoId        = pedidoId,
                UsuarioId       = usuarioId,
                Observaciones   = $"Anulación de movimiento Id={orig.Id}"
            };
            await _movRepo.AddAsync(anulacion);

            // Revertir stock si el original afectaba stock
            if ((orig.CodigoAccion.TipoAfectacion == TipoAfectacion.Stock ||
                 orig.CodigoAccion.TipoAfectacion == TipoAfectacion.Ambos)
                && orig.ProductoId.HasValue)
            {
                await RevertirArtiStockAsync(orig.ProductoId.Value, orig.LocalId,
                    orig.Cantidad, orig.CodigoAccion);
            }
        }

        await _movRepo.SaveChangesAsync();
        await _stockRepo.SaveChangesAsync();
    }

    // ----------------------------------------------------------------
    // Consultas
    // ----------------------------------------------------------------
    public async Task<IEnumerable<CodigoAccionDto>> GetCodigosAccionAsync()
    {
        var codigos = await _codigoRepo.FindAsync(c => c.Activo);
        return codigos.Select(c => new CodigoAccionDto(
            c.Id, c.Codigo, c.Nombre, c.Signo, c.TipoAfectacion.ToString(), c.Activo));
    }

    public async Task<IEnumerable<MovimientoDto>> GetByLocalAsync(
        int localId, DateTime? desde, DateTime? hasta)
    {
        var items = await _movRepo.GetByLocalAsync(localId, desde, hasta);
        return items.Select(m => ToDto(m, m.CodigoAccion));
    }

    public async Task<IEnumerable<MovimientoDto>> GetByProductoLocalAsync(
        int productoId, int localId, DateTime? desde, DateTime? hasta)
    {
        var items = await _movRepo.GetByProductoLocalAsync(productoId, localId, desde, hasta);
        return items.Select(m => ToDto(m, m.CodigoAccion));
    }

    public async Task<IEnumerable<MovimientoDto>> GetByPedidoAsync(int pedidoId)
    {
        var items = await _movRepo.GetByPedidoAsync(pedidoId);
        return items.Select(m => ToDto(m, m.CodigoAccion));
    }

    // ================================================================
    // Métodos privados
    // ================================================================

    private static Movimiento CrearEgrVta(
        int productoId, int localId, decimal cantidad,
        decimal precioUnitario, decimal montoTotal,
        int pedidoId, int? usuarioId,
        DateTime fechaMov, DateTime fechaProceso)
    {
        return new Movimiento
        {
            FechaMovimiento = fechaMov,
            FechaProceso    = fechaProceso,
            CodigoAccionId  = 1,  // EGR_VTA
            ProductoId      = productoId,
            LocalId         = localId,
            Cantidad        = cantidad,
            PrecioUnitario  = precioUnitario,
            MontoTotal      = montoTotal,
            PedidoId        = pedidoId,
            UsuarioId       = usuarioId
        };
    }

    private async Task ActualizarArtiStockAsync(
        int productoId, int localId, decimal cantidad, CodigoAccion codigo)
    {
        var stock = await ObtenerOCrearArtiStockAsync(productoId, localId);

        if (codigo.Codigo == "EGR_VTA")
            stock.VentaLocal += cantidad;
        else if (codigo.Signo == 1)
            stock.IngresoLocal += cantidad;
        else
            stock.EgresoLocal += cantidad;

        stock.StockFinal         = stock.IngresoLocal - stock.EgresoLocal - stock.VentaLocal;
        stock.UltimaModificacion = DateTime.Now;

        await _stockRepo.AddOrUpdateAsync(stock);
    }

    private async Task ActualizarArtiStockVentaAsync(int productoId, int localId, decimal cantidad)
    {
        var stock = await ObtenerOCrearArtiStockAsync(productoId, localId);

        stock.VentaLocal         += cantidad;
        stock.StockFinal          = stock.IngresoLocal - stock.EgresoLocal - stock.VentaLocal;
        stock.UltimaModificacion  = DateTime.Now;

        await _stockRepo.AddOrUpdateAsync(stock);
    }

    private async Task RevertirArtiStockAsync(
        int productoId, int localId, decimal cantidad, CodigoAccion codigoOriginal)
    {
        var stock = await ObtenerOCrearArtiStockAsync(productoId, localId);

        // Invertir el efecto que tuvo el movimiento original
        if (codigoOriginal.Codigo == "EGR_VTA")
            stock.VentaLocal   = Math.Max(0, stock.VentaLocal   - cantidad);
        else if (codigoOriginal.Signo == 1)
            stock.IngresoLocal = Math.Max(0, stock.IngresoLocal - cantidad);
        else
            stock.EgresoLocal  = Math.Max(0, stock.EgresoLocal  - cantidad);

        stock.StockFinal         = stock.IngresoLocal - stock.EgresoLocal - stock.VentaLocal;
        stock.UltimaModificacion = DateTime.Now;

        await _stockRepo.AddOrUpdateAsync(stock);
    }

    private async Task<ArtiStock> ObtenerOCrearArtiStockAsync(int productoId, int localId)
    {
        return await _stockRepo.GetByProductoLocalAsync(productoId, localId)
            ?? new ArtiStock
            {
                ProductoId         = productoId,
                LocalId            = localId,
                IngresoLocal       = 0,
                EgresoLocal        = 0,
                VentaLocal         = 0,
                StockFinal         = 0,
                UltimaModificacion = DateTime.Now
            };
    }

    private static MovimientoDto ToDto(Movimiento m, CodigoAccion codigo) =>
        new(m.Id,
            m.FechaMovimiento, m.FechaProceso,
            m.CodigoAccionId,  codigo.Codigo, codigo.Nombre, codigo.Signo,
            m.ProductoId,      m.Producto?.Nombre,
            m.LocalId,         m.Local?.Nombre ?? string.Empty,
            m.Cantidad,        m.PrecioUnitario, m.MontoTotal,
            m.PedidoId,        m.Pedido?.NumeroTicket,
            m.UsuarioId,       m.Usuario?.NombreCompleto,
            m.Observaciones);
}
