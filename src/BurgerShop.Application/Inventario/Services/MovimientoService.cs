using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Domain.Interfaces.Ventas;

namespace BurgerShop.Application.Inventario.Services;

public class MovimientoService : IMovimientoService
{
    private readonly IMovimientoRepository          _movRepo;
    private readonly IArtiStockRepository           _stockRepo;
    private readonly IRepository<CodigoAccion>      _codigoRepo;
    private readonly IVentaRepository               _ventaRepo;
    private readonly IComboRepository               _comboRepo;
    private readonly ICuentaCorrienteRepository     _cuentaCorrienteRepo;

    public MovimientoService(
        IMovimientoRepository         movRepo,
        IArtiStockRepository          stockRepo,
        IRepository<CodigoAccion>     codigoRepo,
        IVentaRepository              ventaRepo,
        IComboRepository              comboRepo,
        ICuentaCorrienteRepository    cuentaCorrienteRepo)
    {
        _movRepo             = movRepo;
        _stockRepo           = stockRepo;
        _codigoRepo          = codigoRepo;
        _ventaRepo           = ventaRepo;
        _comboRepo           = comboRepo;
        _cuentaCorrienteRepo = cuentaCorrienteRepo;
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
            await _stockRepo.SaveChangesAsync();
        }

        return ToDto(movimiento, codigo);
    }

    // ----------------------------------------------------------------
    // Registrar movimientos automáticos al confirmar una venta
    // ----------------------------------------------------------------
    public async Task<IEnumerable<MovimientoDto>> RegistrarMovimientosVentaAsync(
        int ventaId, int localId, int? usuarioId)
    {
        var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId)
            ?? throw new InvalidOperationException($"Venta {ventaId} no encontrada.");

        var codigoEgr = await _codigoRepo.GetByIdAsync(1)  // EGR_VTA
            ?? throw new InvalidOperationException("Código EGR_VTA (Id=1) no encontrado en la base de datos.");
        var codigoIng = await _codigoRepo.GetByIdAsync(2)  // ING_VTA
            ?? throw new InvalidOperationException("Código ING_VTA (Id=2) no encontrado en la base de datos.");

        var movimientos = new List<(Movimiento Movimiento, CodigoAccion Codigo)>();
        var ahora       = DateTime.Now;

        // Un movimiento EGR_VTA por cada producto o componente de combo
        foreach (var linea in venta.Lineas)
        {
            if (linea.ProductoId.HasValue)
            {
                var mov = CrearEgrVta(linea.ProductoId.Value, localId,
                    linea.Cantidad, linea.PrecioUnitario, linea.Subtotal,
                    ventaId, usuarioId, ahora, ahora);

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
                    VentaId         = ventaId,
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

        // Un movimiento ING_VTA por el total de la venta (ingreso de caja)
        var movIngreso = new Movimiento
        {
            FechaMovimiento = ahora,
            FechaProceso    = ahora,
            CodigoAccionId  = codigoIng.Id,
            ProductoId      = null,
            LocalId         = localId,
            Cantidad        = 1,
            PrecioUnitario  = venta.Total,
            MontoTotal      = venta.Total,
            VentaId         = ventaId,
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
    public async Task RegistrarMovimientosVentaStockAsync(int ventaId, int localId, int? usuarioId)
    {
        var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
        if (venta is null) return;

        var codigoEgr = await _codigoRepo.GetByIdAsync(1); // EGR_VTA
        if (codigoEgr is null) return;

        var ahora = DateTime.Now;

        foreach (var linea in venta.Lineas)
        {
            if (linea.ProductoId.HasValue)
            {
                var mov = CrearEgrVta(linea.ProductoId.Value, localId,
                    linea.Cantidad, linea.PrecioUnitario, linea.Subtotal,
                    ventaId, usuarioId, ahora, ahora);
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
                    VentaId         = ventaId,
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
    public async Task RegistrarMovimientosVentaCajaAsync(int ventaId, int localId, int? usuarioId)
    {
        var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
        if (venta is null) return;

        var codigoIng = await _codigoRepo.GetByIdAsync(2); // ING_VTA
        if (codigoIng is null) return;

        var ahora = DateTime.Now;

        var movIngreso = new Movimiento
        {
            FechaMovimiento = ahora,
            FechaProceso    = ahora,
            CodigoAccionId  = codigoIng.Id,
            ProductoId      = null,
            LocalId         = localId,
            Cantidad        = 1,
            PrecioUnitario  = venta.Total,
            MontoTotal      = venta.Total,
            VentaId         = ventaId,
            UsuarioId       = usuarioId
        };

        await _movRepo.AddAsync(movIngreso);
        await _movRepo.SaveChangesAsync();
    }

    // ----------------------------------------------------------------
    // Anular todos los movimientos de una venta
    // ----------------------------------------------------------------
    public async Task AnularMovimientosVentaAsync(int ventaId, int? usuarioId)
    {
        var originales = await _movRepo.GetByVentaAsync(ventaId);
        var ahora      = DateTime.Now;

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
                VentaId         = ventaId,
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
    // Registrar devolución de cliente
    // ----------------------------------------------------------------
    public async Task<MovimientoDto> RegistrarDevolucionAsync(CrearDevolucionDto dto, int? usuarioId)
    {
        if (dto.ProductoId is null && dto.ComboId is null)
            throw new InvalidOperationException("Se debe indicar un producto o un combo para la devolución.");

        if (dto.ProductoId is not null && dto.ComboId is not null)
            throw new InvalidOperationException("No se puede indicar producto y combo al mismo tiempo.");

        if (string.IsNullOrWhiteSpace(dto.Motivo))
            throw new InvalidOperationException("El motivo de la devolución es obligatorio.");

        if (dto.Cantidad <= 0)
            throw new InvalidOperationException("La cantidad debe ser mayor a cero.");

        if (dto.PrecioUnitario < 0)
            throw new InvalidOperationException("El precio unitario no puede ser negativo.");

        var codigoDevCli = await _codigoRepo.GetByIdAsync(8)  // DEV_CLI
            ?? throw new InvalidOperationException("Código de acción DEV_CLI (Id=8) no encontrado.");

        var codigoNtcCta = await _codigoRepo.GetByIdAsync(14) // NTC_CTA
            ?? throw new InvalidOperationException("Código de acción NTC_CTA (Id=14) no encontrado.");

        var ahora         = DateTime.Now;
        var montoTotal    = dto.Cantidad * dto.PrecioUnitario;
        Movimiento movStock;

        if (dto.ProductoId.HasValue)
        {
            // Devolución de producto simple
            movStock = new Movimiento
            {
                FechaMovimiento = dto.FechaMovimiento,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoDevCli.Id,
                ProductoId      = dto.ProductoId,
                LocalId         = dto.LocalId,
                Cantidad        = dto.Cantidad,
                PrecioUnitario  = dto.PrecioUnitario,
                MontoTotal      = montoTotal,
                UsuarioId       = usuarioId,
                Observaciones   = dto.Motivo
            };

            await _movRepo.AddAsync(movStock);
            await _movRepo.SaveChangesAsync();

            // Actualizar stock: ingresa mercadería devuelta (IngresoLocal)
            var stock = await ObtenerOCrearArtiStockAsync(dto.ProductoId.Value, dto.LocalId);
            stock.IngresoLocal       += dto.Cantidad;
            stock.StockFinal          = stock.IngresoLocal - stock.EgresoLocal - stock.VentaLocal;
            stock.UltimaModificacion  = ahora;
            await _stockRepo.AddOrUpdateAsync(stock);
            await _stockRepo.SaveChangesAsync();
        }
        else
        {
            // Devolución de combo: 1 movimiento visible con nombre del combo
            // + actualizar ArtiStock de cada componente
            var combo = await _comboRepo.GetByIdWithDetallesAsync(dto.ComboId!.Value)
                ?? throw new InvalidOperationException($"Combo {dto.ComboId} no encontrado.");

            movStock = new Movimiento
            {
                FechaMovimiento = dto.FechaMovimiento,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoDevCli.Id,
                ProductoId      = null,
                LocalId         = dto.LocalId,
                Cantidad        = dto.Cantidad,
                PrecioUnitario  = dto.PrecioUnitario,
                MontoTotal      = montoTotal,
                UsuarioId       = usuarioId,
                Observaciones   = $"{combo.Nombre} - {dto.Motivo}"
            };

            await _movRepo.AddAsync(movStock);
            await _stockRepo.SaveChangesAsync();

            // Actualizar stock de cada componente del combo
            if (combo.Detalles != null)
            {
                foreach (var detalle in combo.Detalles)
                {
                    var cantidadComponente = dto.Cantidad * detalle.Cantidad;
                    var stock = await ObtenerOCrearArtiStockAsync(detalle.ProductoId, dto.LocalId);
                    stock.IngresoLocal       += cantidadComponente;
                    stock.StockFinal          = stock.IngresoLocal - stock.EgresoLocal - stock.VentaLocal;
                    stock.UltimaModificacion  = ahora;
                    await _stockRepo.AddOrUpdateAsync(stock);
                }
            }

            await _movRepo.SaveChangesAsync();
            await _stockRepo.SaveChangesAsync();
        }

        // Movimiento de caja: NTC_CTA (egreso de dinero por devolución)
        if (montoTotal > 0)
        {
            var movCaja = new Movimiento
            {
                FechaMovimiento = dto.FechaMovimiento,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoNtcCta.Id,
                ProductoId      = null,
                LocalId         = dto.LocalId,
                Cantidad        = 1,
                PrecioUnitario  = montoTotal,
                MontoTotal      = montoTotal,
                UsuarioId       = usuarioId,
                Observaciones   = $"Devolución - {dto.Motivo}"
            };

            await _movRepo.AddAsync(movCaja);
            await _movRepo.SaveChangesAsync();
        }

        // Ajuste a favor en cuenta corriente si el cliente tiene saldo deudor
        if (dto.ClienteId.HasValue && montoTotal > 0)
        {
            var cuenta = await _cuentaCorrienteRepo.GetByClienteIdAsync(dto.ClienteId.Value);
            if (cuenta is not null && cuenta.SaldoActual > 0)
            {
                // Acreditar el monto de la devolución (reduce la deuda del cliente)
                var montoAjuste  = Math.Min(montoTotal, cuenta.SaldoActual);
                var nuevoSaldo   = cuenta.SaldoActual - montoAjuste;

                var movCtaCte = new MovimientoCuentaCorriente
                {
                    CuentaCorrienteId = cuenta.Id,
                    FechaMovimiento   = ahora,
                    FechaProceso      = ahora,
                    Tipo              = TipoMovimientoCuentaCorriente.AjusteManual,
                    Monto             = montoAjuste,
                    SaldoResultante   = nuevoSaldo,
                    MovimientoId      = movStock.Id,
                    UsuarioId         = usuarioId,
                    Observaciones     = $"Ajuste por devolución - {dto.Motivo}"
                };

                cuenta.SaldoActual           = nuevoSaldo;
                cuenta.FechaUltimoMovimiento = ahora;

                await _cuentaCorrienteRepo.AddMovimientoAsync(movCtaCte);
                _cuentaCorrienteRepo.Update(cuenta);
                await _cuentaCorrienteRepo.SaveChangesAsync();
            }
        }

        return ToDto(movStock, codigoDevCli);
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

    public async Task<IEnumerable<MovimientoDto>> GetByVentaAsync(int ventaId)
    {
        var items = await _movRepo.GetByVentaAsync(ventaId);
        return items.Select(m => ToDto(m, m.CodigoAccion));
    }

    // ================================================================
    // Métodos privados
    // ================================================================

    private static Movimiento CrearEgrVta(
        int productoId, int localId, decimal cantidad,
        decimal precioUnitario, decimal montoTotal,
        int ventaId, int? usuarioId,
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
            VentaId         = ventaId,
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
            m.VentaId,         m.Venta?.NumeroTicket,
            m.UsuarioId,       m.Usuario?.NombreCompleto,
            m.Observaciones,
            m.Venta?.NombreCliente ?? m.Venta?.Cliente?.Nombre);
}
