using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Domain.Interfaces.Ventas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Inventario.Services;

public class MovimientoService : IMovimientoService
{
    private readonly IMovimientoRepository          _movRepo;
    private readonly IArtiStockRepository           _stockRepo;
    private readonly IRepository<CodigoAccion>      _codigoRepo;
    private readonly IVentaRepository               _ventaRepo;
    private readonly IComboRepository               _comboRepo;
    private readonly ICuentaCorrienteRepository     _cuentaCorrienteRepo;
    private readonly IProductoRepository            _productoRepo;
    private readonly ICierreCajaRepository          _cajaRepo;
    private readonly ILogger<MovimientoService>     _logger;

    public MovimientoService(
        IMovimientoRepository         movRepo,
        IArtiStockRepository          stockRepo,
        IRepository<CodigoAccion>     codigoRepo,
        IVentaRepository              ventaRepo,
        IComboRepository              comboRepo,
        ICuentaCorrienteRepository    cuentaCorrienteRepo,
        IProductoRepository           productoRepo,
        ICierreCajaRepository         cajaRepo,
        ILogger<MovimientoService>    logger)
    {
        _movRepo             = movRepo;
        _stockRepo           = stockRepo;
        _codigoRepo          = codigoRepo;
        _ventaRepo           = ventaRepo;
        _comboRepo           = comboRepo;
        _cuentaCorrienteRepo = cuentaCorrienteRepo;
        _productoRepo        = productoRepo;
        _cajaRepo            = cajaRepo;
        _logger              = logger;
    }

    // ----------------------------------------------------------------
    // Registrar un movimiento manual
    // ----------------------------------------------------------------
    public async Task<MovimientoDto> RegistrarMovimientoAsync(CrearMovimientoDto dto, int? usuarioId)
    {
        try
        {
            if (dto.FechaMovimiento.Date > DateTime.Today)
                throw new InvalidOperationException("La fecha del movimiento no puede ser futura.");

            var codigo = await _codigoRepo.GetByIdAsync(dto.CodigoAccionId)
                ?? throw new InvalidOperationException($"Código de acción {dto.CodigoAccionId} no encontrado.");

            if (!codigo.Activo)
                throw new InvalidOperationException($"El código de acción '{codigo.Codigo}' no está activo.");

            var ahoraUtc = DateTime.UtcNow;
            var fechaMov = dto.FechaMovimiento.Date == dto.FechaMovimiento ? ahoraUtc : dto.FechaMovimiento;

            var movimiento = new Movimiento
            {
                FechaMovimiento = fechaMov,
                FechaProceso    = ahoraUtc,
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
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarMovimientoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarMovimientoAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Registrar movimientos automáticos al confirmar una venta
    // ----------------------------------------------------------------
    public async Task<IEnumerable<MovimientoDto>> RegistrarMovimientosVentaAsync(
        int ventaId, int localId, int? usuarioId)
    {
        try
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
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarMovimientosVentaAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarMovimientosVentaAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Solo movimientos de STOCK (EGR_VTA) — al finalizar reparto
    // ----------------------------------------------------------------
    public async Task RegistrarMovimientosVentaStockAsync(int ventaId, int localId, int? usuarioId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarMovimientosVentaStockAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Solo movimiento de CAJA (ING_VTA) — al aprobar rendición
    // ----------------------------------------------------------------
    public async Task RegistrarMovimientosVentaCajaAsync(int ventaId, int localId, int? usuarioId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarMovimientosVentaCajaAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Anular todos los movimientos de una venta
    // ----------------------------------------------------------------
    public async Task AnularMovimientosVentaAsync(int ventaId, int? usuarioId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(AnularMovimientosVentaAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Registrar devolución de cliente
    // ----------------------------------------------------------------
    public async Task<MovimientoDto> RegistrarDevolucionAsync(CrearDevolucionDto dto, int? usuarioId)
    {
        try
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
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarDevolucionAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarDevolucionAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Compras de mercadería
    // ----------------------------------------------------------------

    /// <summary>
    /// Registra una compra de mercadería expresada en bultos.
    /// Crea un movimiento ING_CMP (stock) y, si ImpactarEnCaja=true,
    /// un movimiento EGR_CMP (caja) vinculado a la caja abierta del local.
    /// </summary>
    public async Task<MovimientoDto> RegistrarCompraAsync(CrearCompraDto dto, int? usuarioId)
    {
        try
        {
            if (dto.FechaMovimiento.Date > DateTime.Today)
                throw new InvalidOperationException("La fecha del movimiento no puede ser futura.");

            if (dto.CantidadBultos <= 0)
                throw new InvalidOperationException("La cantidad de bultos debe ser mayor a cero.");

            if (dto.PrecioPorBulto < 0)
                throw new InvalidOperationException("El precio por bulto no puede ser negativo.");

            var producto = await _productoRepo.GetByIdAsync(dto.ProductoId)
                ?? throw new InvalidOperationException($"Producto {dto.ProductoId} no encontrado.");

            var codigoIng = await _codigoRepo.GetByIdAsync(3)  // ING_CMP
                ?? throw new InvalidOperationException("Código ING_CMP (Id=3) no encontrado en la base de datos.");

            var unidadesPorBulto  = producto.UnidadesPorBulto > 0 ? producto.UnidadesPorBulto : 1;
            var cantidadPaquetes  = dto.CantidadBultos * unidadesPorBulto;
            var precioUnitario    = unidadesPorBulto > 0 ? dto.PrecioPorBulto / unidadesPorBulto : dto.PrecioPorBulto;
            var montoTotal        = dto.CantidadBultos * dto.PrecioPorBulto;

            var obsDetalle = $"{dto.CantidadBultos} bulto{(dto.CantidadBultos != 1 ? "s" : "")} x {unidadesPorBulto} paq/bulto = {cantidadPaquetes} paq.";
            var observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? obsDetalle
                : $"{obsDetalle} {dto.Observaciones}";

            var ahora    = DateTime.UtcNow;
            var fechaMov = dto.FechaMovimiento.Date == dto.FechaMovimiento ? ahora : dto.FechaMovimiento;

            var movIng = new Movimiento
            {
                FechaMovimiento = fechaMov,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoIng.Id,
                ProductoId      = dto.ProductoId,
                LocalId         = dto.LocalId,
                Cantidad        = cantidadPaquetes,
                PrecioUnitario  = precioUnitario,
                MontoTotal      = montoTotal,
                UsuarioId       = usuarioId,
                Observaciones   = observaciones
            };

            await _movRepo.AddAsync(movIng);

            // Actualizar stock: ING_CMP tiene Signo=+1 → IngresoLocal
            await ActualizarArtiStockAsync(dto.ProductoId, dto.LocalId, cantidadPaquetes, codigoIng);

            await _movRepo.SaveChangesAsync();
            await _stockRepo.SaveChangesAsync();

            // Movimiento de caja EGR_CMP si corresponde
            if (dto.ImpactarEnCaja)
            {
                var codigoEgr = await _codigoRepo.GetByIdAsync(4)  // EGR_CMP
                    ?? throw new InvalidOperationException("Código EGR_CMP (Id=4) no encontrado en la base de datos.");

                var caja = await _cajaRepo.GetCajaAbiertaAsync(dto.LocalId);

                var movEgr = new Movimiento
                {
                    FechaMovimiento = dto.FechaMovimiento,
                    FechaProceso    = ahora,
                    CodigoAccionId  = codigoEgr.Id,
                    ProductoId      = dto.ProductoId,
                    LocalId         = dto.LocalId,
                    Cantidad        = dto.CantidadBultos,
                    PrecioUnitario  = dto.PrecioPorBulto,
                    MontoTotal      = montoTotal,
                    UsuarioId       = usuarioId,
                    CierreCajaId    = caja?.Id,
                    Observaciones   = observaciones
                };

                await _movRepo.AddAsync(movEgr);
                await _movRepo.SaveChangesAsync();
            }

            return ToDto(movIng, codigoIng);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarCompraAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarCompraAsync), ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Edita una compra existente a partir del Id del movimiento ING_CMP.
    /// Revierte el stock anterior, recalcula con los nuevos valores y actualiza.
    /// Si existe un movimiento EGR_CMP vinculado (mismo productoId, misma fecha de proceso,
    /// mismo usuario), también lo actualiza.
    /// </summary>
    public async Task<MovimientoDto> EditarCompraAsync(int movimientoIngId, EditarCompraDto dto, int? usuarioId)
    {
        try
        {
            if (dto.FechaMovimiento.Date > DateTime.Today)
                throw new InvalidOperationException("La fecha del movimiento no puede ser futura.");

            if (dto.CantidadBultos <= 0)
                throw new InvalidOperationException("La cantidad de bultos debe ser mayor a cero.");

            if (dto.PrecioPorBulto < 0)
                throw new InvalidOperationException("El precio por bulto no puede ser negativo.");

            var movIng = await _movRepo.GetByIdAsync(movimientoIngId)
                ?? throw new InvalidOperationException($"Movimiento {movimientoIngId} no encontrado.");

            if (movIng.CodigoAccionId != 3)
                throw new InvalidOperationException("El movimiento indicado no corresponde a una compra (ING_CMP).");

            var codigoIng = await _codigoRepo.GetByIdAsync(3)
                ?? throw new InvalidOperationException("Código ING_CMP (Id=3) no encontrado en la base de datos.");

            // Revertir stock anterior antes de aplicar los nuevos valores
            await RevertirArtiStockAsync(movIng.ProductoId!.Value, movIng.LocalId, movIng.Cantidad, codigoIng);

            var producto = await _productoRepo.GetByIdAsync(movIng.ProductoId!.Value)
                ?? throw new InvalidOperationException($"Producto {movIng.ProductoId} no encontrado.");

            var unidadesPorBulto = producto.UnidadesPorBulto > 0 ? producto.UnidadesPorBulto : 1;
            var cantidadPaquetes = dto.CantidadBultos * unidadesPorBulto;
            var precioUnitario   = unidadesPorBulto > 0 ? dto.PrecioPorBulto / unidadesPorBulto : dto.PrecioPorBulto;
            var montoTotal       = dto.CantidadBultos * dto.PrecioPorBulto;

            var obsDetalle = $"{dto.CantidadBultos} bulto{(dto.CantidadBultos != 1 ? "s" : "")} x {unidadesPorBulto} paq/bulto = {cantidadPaquetes} paq.";
            var observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? obsDetalle
                : $"{obsDetalle} {dto.Observaciones}";

            // Actualizar movimiento ING_CMP
            movIng.FechaMovimiento = dto.FechaMovimiento;
            movIng.Cantidad        = cantidadPaquetes;
            movIng.PrecioUnitario  = precioUnitario;
            movIng.MontoTotal      = montoTotal;
            movIng.Observaciones   = observaciones;
            _movRepo.Update(movIng);

            // Recalcular stock con los nuevos valores
            await ActualizarArtiStockAsync(movIng.ProductoId.Value, movIng.LocalId, cantidadPaquetes, codigoIng);

            await _movRepo.SaveChangesAsync();
            await _stockRepo.SaveChangesAsync();

            // Buscar movimiento EGR_CMP vinculado: mismo producto, mismo local, mismo usuario, mismo proceso
            var candidatos = await _movRepo.FindAsync(m =>
                m.CodigoAccionId == 4
                && m.ProductoId  == movIng.ProductoId
                && m.LocalId     == movIng.LocalId
                && m.UsuarioId   == movIng.UsuarioId
                && m.FechaProceso == movIng.FechaProceso);

            var movEgr = candidatos.FirstOrDefault();

            if (movEgr is not null)
            {
                if (dto.ImpactarEnCaja)
                {
                    movEgr.FechaMovimiento = dto.FechaMovimiento;
                    movEgr.Cantidad        = dto.CantidadBultos;
                    movEgr.PrecioUnitario  = dto.PrecioPorBulto;
                    movEgr.MontoTotal      = montoTotal;
                    movEgr.Observaciones   = observaciones;
                    _movRepo.Update(movEgr);
                }
                else
                {
                    // ImpactarEnCaja pasó a false: eliminar el movimiento de caja
                    _movRepo.Remove(movEgr);
                }
                await _movRepo.SaveChangesAsync();
            }
            else if (dto.ImpactarEnCaja)
            {
                // No existía EGR_CMP pero ahora se quiere: crearlo
                var codigoEgr = await _codigoRepo.GetByIdAsync(4)
                    ?? throw new InvalidOperationException("Código EGR_CMP (Id=4) no encontrado en la base de datos.");

                var caja = await _cajaRepo.GetCajaAbiertaAsync(movIng.LocalId);

                var nuevoEgr = new Movimiento
                {
                    FechaMovimiento = dto.FechaMovimiento,
                    FechaProceso    = movIng.FechaProceso, // mismo timestamp de proceso para mantener vínculo
                    CodigoAccionId  = codigoEgr.Id,
                    ProductoId      = movIng.ProductoId,
                    LocalId         = movIng.LocalId,
                    Cantidad        = dto.CantidadBultos,
                    PrecioUnitario  = dto.PrecioPorBulto,
                    MontoTotal      = montoTotal,
                    UsuarioId       = movIng.UsuarioId,
                    CierreCajaId    = caja?.Id,
                    Observaciones   = observaciones
                };

                await _movRepo.AddAsync(nuevoEgr);
                await _movRepo.SaveChangesAsync();
            }

            return ToDto(movIng, codigoIng);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(EditarCompraAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(EditarCompraAsync), ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Elimina una compra a partir del Id del movimiento ING_CMP.
    /// Revierte el stock y elimina también el EGR_CMP vinculado si existe.
    /// </summary>
    public async Task EliminarCompraAsync(int movimientoIngId, int? usuarioId)
    {
        try
        {
            var movIng = await _movRepo.GetByIdAsync(movimientoIngId)
                ?? throw new InvalidOperationException($"Movimiento {movimientoIngId} no encontrado.");

            if (movIng.CodigoAccionId != 3)
                throw new InvalidOperationException("El movimiento indicado no corresponde a una compra (ING_CMP).");

            var codigoIng = await _codigoRepo.GetByIdAsync(3)
                ?? throw new InvalidOperationException("Código ING_CMP (Id=3) no encontrado en la base de datos.");

            // Revertir stock
            if (movIng.ProductoId.HasValue)
            {
                await RevertirArtiStockAsync(movIng.ProductoId.Value, movIng.LocalId, movIng.Cantidad, codigoIng);
                await _stockRepo.SaveChangesAsync();
            }

            // Buscar EGR_CMP vinculado
            var candidatos = await _movRepo.FindAsync(m =>
                m.CodigoAccionId == 4
                && m.ProductoId  == movIng.ProductoId
                && m.LocalId     == movIng.LocalId
                && m.UsuarioId   == movIng.UsuarioId
                && m.FechaProceso == movIng.FechaProceso);

            var movEgr = candidatos.FirstOrDefault();

            if (movEgr is not null)
                _movRepo.Remove(movEgr);

            _movRepo.Remove(movIng);
            await _movRepo.SaveChangesAsync();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(EliminarCompraAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(EliminarCompraAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Transferencias de stock entre locales
    // ----------------------------------------------------------------

    /// <summary>
    /// Registra una transferencia de stock entre dos locales.
    /// Crea un EGR_TRF en el local de origen y un ING_TRF en el local de destino.
    /// Retorna el MovimientoDto correspondiente al ING_TRF (destino).
    /// </summary>
    public async Task<MovimientoDto> RegistrarTransferenciaAsync(CrearTransferenciaDto dto, int? usuarioId)
    {
        try
        {
            if (dto.LocalOrigenId == dto.LocalDestinoId)
                throw new InvalidOperationException("El local de origen y el local de destino no pueden ser el mismo.");

            if (dto.CantidadBultos <= 0)
                throw new InvalidOperationException("La cantidad de bultos debe ser mayor a cero.");

            var producto = await _productoRepo.GetByIdAsync(dto.ProductoId)
                ?? throw new InvalidOperationException($"Producto {dto.ProductoId} no encontrado.");

            var codigoEgr = await _codigoRepo.GetByIdAsync(11) // EGR_TRF
                ?? throw new InvalidOperationException("Código EGR_TRF (Id=11) no encontrado en la base de datos.");

            var codigoIng = await _codigoRepo.GetByIdAsync(10) // ING_TRF
                ?? throw new InvalidOperationException("Código ING_TRF (Id=10) no encontrado en la base de datos.");

            var upb              = producto.UnidadesPorBulto > 0 ? producto.UnidadesPorBulto : 1;
            var cantidadPaquetes = (decimal)(dto.CantidadBultos * upb);

            var obsBase = $"Transferencia: {dto.CantidadBultos} bulto{(dto.CantidadBultos != 1 ? "s" : "")} x {upb} paq/bulto = {cantidadPaquetes} paq. De local {dto.LocalOrigenId} a local {dto.LocalDestinoId}.";
            var observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? obsBase
                : $"{obsBase} {dto.Observaciones}";

            var ahora = DateTime.UtcNow;

            // Movimiento de egreso en el local de origen
            var movEgr = new Movimiento
            {
                FechaMovimiento = ahora,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoEgr.Id,
                ProductoId      = dto.ProductoId,
                LocalId         = dto.LocalOrigenId,
                Cantidad        = cantidadPaquetes,
                PrecioUnitario  = 0,
                MontoTotal      = 0,
                UsuarioId       = usuarioId,
                Observaciones   = observaciones
            };

            // Movimiento de ingreso en el local de destino
            var movIng = new Movimiento
            {
                FechaMovimiento = ahora,
                FechaProceso    = ahora,
                CodigoAccionId  = codigoIng.Id,
                ProductoId      = dto.ProductoId,
                LocalId         = dto.LocalDestinoId,
                Cantidad        = cantidadPaquetes,
                PrecioUnitario  = 0,
                MontoTotal      = 0,
                UsuarioId       = usuarioId,
                Observaciones   = observaciones
            };

            await _movRepo.AddAsync(movEgr);
            await _movRepo.AddAsync(movIng);

            // Actualizar stock en ambos locales
            await ActualizarArtiStockAsync(dto.ProductoId, dto.LocalOrigenId, cantidadPaquetes, codigoEgr);
            await ActualizarArtiStockAsync(dto.ProductoId, dto.LocalDestinoId, cantidadPaquetes, codigoIng);

            await _movRepo.SaveChangesAsync();
            await _stockRepo.SaveChangesAsync();

            return ToDto(movIng, codigoIng);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarTransferenciaAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarTransferenciaAsync), ex.Message);
            throw;
        }
    }

    // ----------------------------------------------------------------
    // Consultas
    // ----------------------------------------------------------------
    public async Task<IEnumerable<CodigoAccionDto>> GetCodigosAccionAsync()
    {
        try
        {
            var codigos = await _codigoRepo.FindAsync(c => c.Activo);
            return codigos.Select(c => new CodigoAccionDto(
                c.Id, c.Codigo, c.Nombre, c.Signo, c.TipoAfectacion.ToString(), c.Activo));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetCodigosAccionAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<MovimientoDto>> GetByLocalAsync(
        int localId, DateTime? desde, DateTime? hasta)
    {
        try
        {
            var items = await _movRepo.GetByLocalAsync(localId, desde, hasta);
            return items.Select(m => ToDto(m, m.CodigoAccion));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByLocalAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<MovimientoDto>> GetByProductoLocalAsync(
        int productoId, int localId, DateTime? desde, DateTime? hasta)
    {
        try
        {
            var items = await _movRepo.GetByProductoLocalAsync(productoId, localId, desde, hasta);
            return items.Select(m => ToDto(m, m.CodigoAccion));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByProductoLocalAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<MovimientoDto>> GetByVentaAsync(int ventaId)
    {
        try
        {
            var items = await _movRepo.GetByVentaAsync(ventaId);
            return items.Select(m => ToDto(m, m.CodigoAccion));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByVentaAsync), ex.Message);
            throw;
        }
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
