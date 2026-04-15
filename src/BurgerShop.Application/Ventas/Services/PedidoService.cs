using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Finanzas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Ventas.Services;

public class VentaService : IVentaService
{
    private readonly IVentaRepository _ventaRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IComboRepository _comboRepo;
    private readonly IRepository<FormaPago> _formaPagoRepo;
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly IMovimientoService _movimientoService;
    private readonly ILogger<VentaService> _logger;

    public VentaService(
        IVentaRepository ventaRepo,
        IProductoRepository productoRepo,
        IComboRepository comboRepo,
        IRepository<FormaPago> formaPagoRepo,
        ICierreCajaRepository cajaRepo,
        IMovimientoService movimientoService,
        ILogger<VentaService> logger)
    {
        _ventaRepo = ventaRepo;
        _productoRepo = productoRepo;
        _comboRepo = comboRepo;
        _formaPagoRepo = formaPagoRepo;
        _cajaRepo = cajaRepo;
        _movimientoService = movimientoService;
        _logger = logger;
    }

    public async Task<VentaDto> CreateAsync(CrearVentaDto dto, int? usuarioId = null)
    {
        try
        {
            var ahora = DateTime.Now;

            // Generar numero de ticket según tipo
            string ticket;
            if (dto.Tipo == TipoVenta.Mostrador)
            {
                var numero = await _ventaRepo.GetSiguienteNumeroVentaAsync(ahora);
                ticket = $"V-{ahora:yyyyMMdd}-{numero:D4}";
            }
            else
            {
                var numero = await _ventaRepo.GetSiguienteNumeroTicketAsync(ahora);
                ticket = $"T-{ahora:yyyyMMdd}-{numero:D4}";
            }

            if (dto.FechaProgramada.HasValue)
            {
                var fechaProg = dto.FechaProgramada.Value.Date;
                var hoyDate = ahora.Date;
                var maxFecha = hoyDate.AddDays(14);
                if (fechaProg < hoyDate || fechaProg > maxFecha)
                    throw new InvalidOperationException(
                        "La fecha programada debe ser desde hoy y no mayor a 14 días.");
            }

            // El estado inicial depende del tipo
            var estadoInicial = dto.Tipo == TipoVenta.Mostrador
                ? EstadoVenta.Entregado
                : EstadoVenta.Pendiente;

            var venta = new Venta
            {
                NumeroTicket = ticket,
                FechaCreacion = ahora,
                Tipo = dto.Tipo,
                Estado = estadoInicial,
                ClienteId = dto.ClienteId,
                NombreCliente = dto.NombreCliente,
                TelefonoCliente = dto.TelefonoCliente,
                DireccionEntrega = dto.DireccionEntrega,
                ZonaId = dto.ZonaId,
                Descuento = dto.Descuento,
                NotaInterna = dto.NotaInterna,
                TipoFactura = dto.TipoFactura,
                FechaProgramada = dto.FechaProgramada,
                EstaPago = dto.EstaPago,
                LocalId = dto.LocalId,
                Observaciones = dto.Observaciones,
                UsuarioId = usuarioId
            };

            decimal subtotal = 0;
            foreach (var linea in dto.Lineas)
            {
                string descripcion;
                if (linea.ProductoId.HasValue)
                {
                    var producto = await _productoRepo.GetByIdAsync(linea.ProductoId.Value);
                    descripcion = producto?.Nombre ?? "Producto";
                }
                else if (linea.ComboId.HasValue)
                {
                    var combo = await _comboRepo.GetByIdAsync(linea.ComboId.Value);
                    descripcion = combo?.Nombre ?? "Combo";
                }
                else
                {
                    descripcion = "Item";
                }

                var lineaSubtotal = linea.PrecioUnitario * linea.Cantidad;
                venta.Lineas.Add(new LineaVenta
                {
                    ProductoId = linea.ProductoId,
                    ComboId = linea.ComboId,
                    Descripcion = descripcion,
                    Cantidad = linea.Cantidad,
                    PrecioUnitario = linea.PrecioUnitario,
                    Subtotal = lineaSubtotal,
                    Notas = linea.Notas
                });
                subtotal += lineaSubtotal;
            }

            venta.Subtotal = subtotal;

            if (dto.Pagos is { Count: > 0 })
            {
                // Modo pago dividido: múltiples formas de pago
                decimal recargoTotal = 0;
                venta.FormaPagoId = null;

                foreach (var pagoDto in dto.Pagos)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                    var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                    var recargoPago = pagoDto.Monto * porcentaje / 100m;
                    var totalACobrar = pagoDto.Monto + recargoPago;

                    venta.Pagos.Add(new PagoVenta
                    {
                        FormaPagoId = pagoDto.FormaPagoId,
                        Monto = pagoDto.Monto,
                        PorcentajeRecargo = porcentaje,
                        Recargo = recargoPago,
                        TotalACobrar = totalACobrar
                    });

                    recargoTotal += recargoPago;
                }

                venta.Recargo = recargoTotal;
                venta.Total = subtotal - dto.Descuento + recargoTotal;
            }
            else
            {
                // Modo pago simple: una sola forma de pago
                venta.FormaPagoId = dto.FormaPagoId;
                decimal recargo = 0;

                if (dto.FormaPagoId.HasValue)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                    if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                    {
                        recargo = (subtotal - dto.Descuento) * formaPago.PorcentajeRecargo / 100m;
                    }
                }

                venta.Recargo = recargo;
                venta.Total = subtotal - dto.Descuento + recargo;
            }

            // Calcular IVA desglosado (precios incluyen IVA)
            decimal totalNeto = 0;
            foreach (var linea in venta.Lineas)
            {
                decimal alicuota = 21m; // alícuota por defecto
                if (linea.ProductoId.HasValue)
                {
                    var prod = await _productoRepo.GetByIdAsync(linea.ProductoId.Value);
                    alicuota = prod?.AlicuotaIVA ?? 21m;
                }
                var neto = linea.Subtotal / (1m + alicuota / 100m);
                totalNeto += neto;
            }
            venta.MontoNeto = Math.Round(totalNeto, 2);
            venta.MontoIVA = Math.Round(venta.Total - totalNeto, 2);

            // Si es Domicilio con zona, verificar si ya hay reparto activo en esa zona
            if (dto.Tipo == TipoVenta.Domicilio && dto.ZonaId.HasValue)
            {
                var repartoActivo = await _ventaRepo.GetRepartoZonaActivoHoyAsync(dto.ZonaId.Value);
                if (repartoActivo != null)
                {
                    venta.RepartidorId = repartoActivo.RepartidorId;
                    venta.Estado = EstadoVenta.Asignado;
                    venta.FechaAsignacion = ahora;
                    venta.RepartoZonaId = repartoActivo.Id;
                }
            }

            // Asignar caja abierta solo para ventas Mostrador
            // Las ventas Domicilio se vinculan a caja al aprobar la rendición
            if (dto.Tipo == TipoVenta.Mostrador)
            {
                var cajaAbierta = await _cajaRepo.GetCajaAbiertaAsync(dto.LocalId);
                if (cajaAbierta is not null)
                {
                    venta.CierreCajaId = cajaAbierta.Id;
                }
            }

            await _ventaRepo.AddAsync(venta);
            await _ventaRepo.SaveChangesAsync();

            // Si se auto-asignó a un reparto activo, incrementar contador
            if (venta.Estado == EstadoVenta.Asignado && venta.ZonaId.HasValue)
            {
                await _ventaRepo.IncrementarTotalVentasRepartoAsync(venta.ZonaId.Value);
            }

            var created = await _ventaRepo.GetByIdWithLineasAsync(venta.Id);

            // Ventas Mostrador: generar movimientos de stock + caja inmediatamente
            if (dto.Tipo == TipoVenta.Mostrador)
            {
                try
                {
                    await _movimientoService.RegistrarMovimientosVentaStockAsync(venta.Id, dto.LocalId ?? 1, usuarioId);
                    if (dto.EstaPago)
                        await _movimientoService.RegistrarMovimientosVentaCajaAsync(venta.Id, dto.LocalId ?? 1, usuarioId);
                }
                catch
                {
                    // No bloquear la creación si falla el registro de movimientos
                }
            }

            return ToDto(created!);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> UpdateAsync(int id, ActualizarVentaDto dto)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            if (venta is null) return null;

            if (venta.Estado != EstadoVenta.Pendiente && venta.Estado != EstadoVenta.Asignado)
                throw new InvalidOperationException(
                    $"No se puede editar una venta en estado '{venta.Estado}'. Solo se permite en estado Pendiente o Asignado.");

            // En estado Asignado solo se permite editar teléfono, estaPago y formaPago
            if (venta.Estado == EstadoVenta.Asignado)
            {
                venta.TelefonoCliente = dto.TelefonoCliente;
                venta.EstaPago = dto.EstaPago;

                // Recalcular recargo si cambia la forma de pago
                if (dto.Pagos is { Count: > 0 })
                {
                    venta.Pagos.Clear();
                    decimal recargoTotal = 0;
                    venta.FormaPagoId = null;

                    foreach (var pagoDto in dto.Pagos)
                    {
                        var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                        var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                        var recargoPago = pagoDto.Monto * porcentaje / 100m;
                        var totalACobrar = pagoDto.Monto + recargoPago;

                        venta.Pagos.Add(new PagoVenta
                        {
                            FormaPagoId = pagoDto.FormaPagoId,
                            Monto = pagoDto.Monto,
                            PorcentajeRecargo = porcentaje,
                            Recargo = recargoPago,
                            TotalACobrar = totalACobrar
                        });

                        recargoTotal += recargoPago;
                    }

                    venta.Recargo = recargoTotal;
                    venta.Total = venta.Subtotal - venta.Descuento + recargoTotal;
                }
                else
                {
                    venta.Pagos.Clear();
                    venta.FormaPagoId = dto.FormaPagoId;
                    decimal recargo = 0;

                    if (dto.FormaPagoId.HasValue)
                    {
                        var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                        if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                        {
                            recargo = (venta.Subtotal - venta.Descuento) * formaPago.PorcentajeRecargo / 100m;
                        }
                    }

                    venta.Recargo = recargo;
                    venta.Total = venta.Subtotal - venta.Descuento + recargo;
                }

                _ventaRepo.Update(venta);
                await _ventaRepo.SaveChangesAsync();

                var updatedAsignado = await _ventaRepo.GetByIdWithLineasAsync(venta.Id);
                return ToDto(updatedAsignado!);
            }

            if (dto.FechaProgramada.HasValue)
            {
                var fechaProg = dto.FechaProgramada.Value.Date;
                var manana = DateTime.Today.AddDays(1);
                var maxFecha = DateTime.Today.AddDays(14);
                if (fechaProg < manana || fechaProg > maxFecha)
                    throw new InvalidOperationException(
                        "La fecha programada debe ser a partir de mañana y no mayor a 14 días desde hoy.");
            }

            venta.NombreCliente = dto.NombreCliente;
            venta.TelefonoCliente = dto.TelefonoCliente;
            venta.DireccionEntrega = dto.DireccionEntrega;
            venta.ZonaId = dto.ZonaId;
            venta.Descuento = dto.Descuento;
            venta.NotaInterna = dto.NotaInterna;
            venta.TipoFactura = dto.TipoFactura;
            venta.FechaProgramada = dto.FechaProgramada;
            venta.EstaPago = dto.EstaPago;

            // Reemplazar líneas existentes con las nuevas
            venta.Lineas.Clear();
            decimal subtotal = 0;

            foreach (var linea in dto.Lineas)
            {
                string descripcion;
                if (linea.ProductoId.HasValue)
                {
                    var producto = await _productoRepo.GetByIdAsync(linea.ProductoId.Value);
                    descripcion = producto?.Nombre ?? "Producto";
                }
                else if (linea.ComboId.HasValue)
                {
                    var combo = await _comboRepo.GetByIdAsync(linea.ComboId.Value);
                    descripcion = combo?.Nombre ?? "Combo";
                }
                else
                {
                    descripcion = "Item";
                }

                var lineaSubtotal = linea.PrecioUnitario * linea.Cantidad;
                venta.Lineas.Add(new LineaVenta
                {
                    ProductoId = linea.ProductoId,
                    ComboId = linea.ComboId,
                    Descripcion = descripcion,
                    Cantidad = linea.Cantidad,
                    PrecioUnitario = linea.PrecioUnitario,
                    Subtotal = lineaSubtotal,
                    Notas = linea.Notas
                });
                subtotal += lineaSubtotal;
            }

            venta.Subtotal = subtotal;

            if (dto.Pagos is { Count: > 0 })
            {
                venta.Pagos.Clear();
                decimal recargoTotal = 0;
                venta.FormaPagoId = null;

                foreach (var pagoDto in dto.Pagos)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                    var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                    var recargoPago = pagoDto.Monto * porcentaje / 100m;
                    var totalACobrar = pagoDto.Monto + recargoPago;

                    venta.Pagos.Add(new PagoVenta
                    {
                        FormaPagoId = pagoDto.FormaPagoId,
                        Monto = pagoDto.Monto,
                        PorcentajeRecargo = porcentaje,
                        Recargo = recargoPago,
                        TotalACobrar = totalACobrar
                    });

                    recargoTotal += recargoPago;
                }

                venta.Recargo = recargoTotal;
                venta.Total = subtotal - dto.Descuento + recargoTotal;
            }
            else
            {
                venta.Pagos.Clear();
                venta.FormaPagoId = dto.FormaPagoId;
                decimal recargo = 0;

                if (dto.FormaPagoId.HasValue)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                    if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                    {
                        recargo = (subtotal - dto.Descuento) * formaPago.PorcentajeRecargo / 100m;
                    }
                }

                venta.Recargo = recargo;
                venta.Total = subtotal - dto.Descuento + recargo;
            }

            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();

            var updated = await _ventaRepo.GetByIdWithLineasAsync(venta.Id);
            return ToDto(updated!);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> GetByIdAsync(int id)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            return venta is null ? null : ToDto(venta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetByFechaAsync(DateTime fecha)
    {
        try
        {
            var ventas = await _ventaRepo.GetByFechaAsync(fecha);
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByFechaAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetByRangoFechasAsync(DateTime desde, DateTime hasta)
    {
        try
        {
            var ventas = await _ventaRepo.GetByRangoFechasAsync(desde, hasta);
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByRangoFechasAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetByEstadoAsync(EstadoVenta estado)
    {
        try
        {
            var ventas = await _ventaRepo.GetByEstadoAsync(estado);
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByEstadoAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> CambiarEstadoAsync(int id, EstadoVenta nuevoEstado)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            if (venta is null) return null;

            venta.Estado = nuevoEstado;
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();
            return ToDto(venta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CambiarEstadoAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> CancelarAsync(int id, string motivoCancelacion)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(motivoCancelacion))
                throw new InvalidOperationException("El motivo de cancelación es obligatorio.");

            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            if (venta is null) return null;

            venta.Estado = EstadoVenta.Cancelado;
            venta.MotivoCancelacion = motivoCancelacion.Trim();
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();

            if (venta.ZonaId.HasValue)
                await _ventaRepo.IncrementarContadorRepartoAsync(venta.ZonaId.Value, EstadoVenta.Cancelado);

            return ToDto(venta);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(CancelarAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CancelarAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> MarcarNoEntregadoAsync(int id, string motivo)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(motivo))
                throw new InvalidOperationException("El motivo de no entrega es obligatorio.");

            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            if (venta is null) return null;

            if (venta.Estado != EstadoVenta.EnCamino)
                throw new InvalidOperationException("Solo se puede marcar como no entregada una venta en camino.");

            venta.Estado = EstadoVenta.NoEntregado;
            venta.MotivoCancelacion = motivo.Trim();
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();

            if (venta.ZonaId.HasValue)
                await _ventaRepo.IncrementarContadorRepartoAsync(venta.ZonaId.Value, EstadoVenta.NoEntregado);

            return ToDto(venta);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(MarcarNoEntregadoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(MarcarNoEntregadoAsync), ex.Message);
            throw;
        }
    }

    public async Task<TicketDto?> GetTicketAsync(int id)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(id);
            if (venta is null) return null;

            var pagos = venta.Pagos.Any()
                ? venta.Pagos.Select(MapPagoVentaDto).ToList()
                : null;

            return new TicketDto(
                venta.NumeroTicket,
                venta.FechaCreacion,
                venta.Tipo,
                venta.NombreCliente,
                venta.DireccionEntrega,
                venta.Zona?.Nombre,
                venta.Lineas.Select(l => new LineaVentaDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList(),
                venta.Subtotal,
                venta.Descuento,
                venta.Recargo,
                venta.Total,
                venta.FormaPago?.Nombre,
                venta.NotaInterna,
                venta.TipoFactura,
                pagos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetTicketAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetPendientesEntregaAsync()
    {
        try
        {
            var ventas = await _ventaRepo.GetPendientesEntregaAsync();
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetPendientesEntregaAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> AsignarRepartidorAsync(int ventaId, int repartidorId)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
            if (venta is null) return null;

            venta.RepartidorId = repartidorId;
            venta.Estado = EstadoVenta.Asignado;
            venta.FechaAsignacion = DateTime.Now;
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();

            var updated = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
            return ToDto(updated!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(AsignarRepartidorAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetEntregasRepartidorHoyAsync(int repartidorId)
    {
        try
        {
            var ventas = await _ventaRepo.GetByRepartidorHoyAsync(repartidorId);
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetEntregasRepartidorHoyAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> MarcarEnCaminoAsync(int ventaId)
    {
        try
        {
            return await CambiarEstadoAsync(ventaId, EstadoVenta.EnCamino);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(MarcarEnCaminoAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaDto?> MarcarEntregadoAsync(int ventaId, MarcarEntregadoDto dto)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
            if (venta is null) return null;

            venta.Estado = EstadoVenta.Entregado;
            venta.FechaEntrega = DateTime.Now;
            venta.NotasEntrega = dto.Notas;

            if (dto.FormaPagoId.HasValue)
            {
                venta.FormaPagoId = dto.FormaPagoId.Value;
                venta.EstaPago = true;
            }

            if (!string.IsNullOrEmpty(dto.ComprobanteBase64))
            {
                venta.ComprobanteEntrega = dto.ComprobanteBase64;
            }

            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();

            if (venta.ZonaId.HasValue)
                await _ventaRepo.IncrementarContadorRepartoAsync(venta.ZonaId.Value, EstadoVenta.Entregado);

            return ToDto(venta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(MarcarEntregadoAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetListosParaRepartoHoyAsync()
    {
        try
        {
            var ventas = await _ventaRepo.GetListosParaRepartoHoyAsync();
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetListosParaRepartoHoyAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> EmpezarRepartoAsync(EmpezarRepartoDto dto)
    {
        try
        {
            var ventas = await _ventaRepo.GetListosParaRepartoHoyAsync();
            var ventasList = ventas
                .Where(v => v.Estado == EstadoVenta.Pendiente)
                .ToList();

            if (!ventasList.Any())
                return Enumerable.Empty<VentaDto>();

            var ahora = DateTime.Now;

            foreach (var asignacion in dto.Asignaciones)
            {
                var ventasDeZona = ventasList
                    .Where(v => v.ZonaId == asignacion.ZonaId)
                    .ToList();

                RepartoZona? repartoZona = null;
                if (ventasDeZona.Any())
                {
                    repartoZona = await _ventaRepo.CrearRepartoZonaAsync(
                        asignacion.ZonaId,
                        asignacion.RepartidorId,
                        ventasDeZona.Count,
                        asignacion.MontoInicialCambio);
                }

                foreach (var venta in ventasDeZona)
                {
                    venta.RepartidorId = asignacion.RepartidorId;
                    venta.Estado = EstadoVenta.Asignado;
                    venta.FechaAsignacion = ahora;
                    if (repartoZona != null)
                        venta.RepartoZonaId = repartoZona.Id;
                    _ventaRepo.Update(venta);
                }
            }

            await _ventaRepo.SaveChangesAsync();

            var ventasActualizadas = ventasList
                .Where(v => dto.Asignaciones.Any(a => a.ZonaId == v.ZonaId))
                .ToList();

            return ventasActualizadas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(EmpezarRepartoAsync), ex.Message);
            throw;
        }
    }

    public async Task<int> PrepararTodosAsync()
    {
        try
        {
            // Sin efecto: EstadoVenta no tiene EnPreparacion activo
            return 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(PrepararTodosAsync), ex.Message);
            throw;
        }
    }

    public async Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId)
    {
        try
        {
            await _ventaRepo.FinalizarRepartoZonaAsync(zonaId, repartidorId);

            // Generar movimientos de stock (EGR_VTA) para todas las ventas entregadas del reparto
            try
            {
                var repartosZona = await _ventaRepo.GetRepartosZonaByRepartidorHoyAsync(repartidorId);
                var reparto = repartosZona.FirstOrDefault(r => r.ZonaId == zonaId);
                if (reparto != null)
                {
                    var ventas = await _ventaRepo.GetByRepartidorHoyAsync(repartidorId);
                    var entregadas = ventas
                        .Where(v => v.RepartoZonaId == reparto.Id && v.Estado == EstadoVenta.Entregado)
                        .ToList();

                    foreach (var venta in entregadas)
                    {
                        try
                        {
                            await _movimientoService.RegistrarMovimientosVentaStockAsync(venta.Id, venta.LocalId ?? 1, null);
                        }
                        catch
                        {
                            // No bloquear la finalización si falla un movimiento individual
                        }
                    }
                }
            }
            catch
            {
                // No bloquear la finalización del reparto
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(FinalizarRepartoZonaAsync), ex.Message);
            throw;
        }
    }

    public async Task GuardarTallyRepartoAsync(int zonaId, int repartidorId, string tallyJson)
    {
        try
        {
            await _ventaRepo.GuardarTallyRepartoAsync(zonaId, repartidorId, tallyJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GuardarTallyRepartoAsync), ex.Message);
            throw;
        }
    }

    public async Task<Domain.Entities.Logistica.RepartoZona?> GetRepartoZonaActivoHoyAsync(int zonaId)
    {
        try
        {
            return await _ventaRepo.GetRepartoZonaActivoHoyAsync(zonaId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetRepartoZonaActivoHoyAsync), ex.Message);
            throw;
        }
    }

    public async Task<VentaStatsDto> GetStatsAsync(DateTime fecha, int? localId = null, int? tipo = null)
    {
        try
        {
            var hoy = DateTime.Today;
            var ayer = hoy.AddDays(-1);
            var hace7Dias = hoy.AddDays(-6);
            var hace14Dias = hoy.AddDays(-13);
            var hace8Dias = hoy.AddDays(-7);
            var mismoHaceUnAnio = hoy.AddYears(-1);

            var ventasHoy = await _ventaRepo.GetCountByFechaAsync(hoy, localId, tipo);
            var ventasAyer = await _ventaRepo.GetCountByFechaAsync(ayer, localId, tipo);
            var ventasUltimos7Dias = await _ventaRepo.GetCountByRangoAsync(hace7Dias, hoy, localId, tipo);
            var ventas7DiasAnteriores = await _ventaRepo.GetCountByRangoAsync(hace14Dias, hace8Dias, localId, tipo);
            var ventasAnioAnterior = await _ventaRepo.GetCountByFechaAsync(mismoHaceUnAnio, localId, tipo);

            var (totalBruto, totalVentasFecha) = await _ventaRepo.GetTotalesByFechaAsync(fecha, localId, tipo);
            var ticketPromedio = totalVentasFecha > 0 ? totalBruto / totalVentasFecha : 0m;

            static decimal Porcentaje(int actual, int anterior) =>
                anterior == 0 ? 0m : Math.Round(((decimal)(actual - anterior) / anterior) * 100m, 1);

            return new VentaStatsDto(
                VentasHoy: ventasHoy,
                VentasAyer: ventasAyer,
                PorcentajeVariacionAyer: Porcentaje(ventasHoy, ventasAyer),
                VentasUltimos7Dias: ventasUltimos7Dias,
                PorcentajeVariacion7Dias: Porcentaje(ventasUltimos7Dias, ventas7DiasAnteriores),
                VentasAnioAnterior: ventasAnioAnterior,
                PorcentajeVariacionAnio: Porcentaje(ventasHoy, ventasAnioAnterior),
                TotalVentasFecha: totalVentasFecha,
                TicketPromedio: Math.Round(ticketPromedio, 2),
                TotalBruto: Math.Round(totalBruto, 2));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetStatsAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<VentaDto>> GetVentasDepositoAsync(int? localId)
    {
        try
        {
            var desde = DateTime.Today; // Mostrar ventas de todo el día
            var ventas = await _ventaRepo.GetVentasDepositoAsync(desde, localId);
            return ventas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetVentasDepositoAsync), ex.Message);
            throw;
        }
    }

    public async Task MarcarVencidoDepositoAsync(int ventaId)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
            if (venta is null) return;

            venta.VencidoDeposito = true;
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(MarcarVencidoDepositoAsync), ex.Message);
            throw;
        }
    }

    public async Task EnviarADepositoAsync(int ventaId)
    {
        try
        {
            var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
            if (venta is null)
                throw new InvalidOperationException("Venta no encontrada.");

            venta.FechaEnvioDeposito = DateTime.Now;
            _ventaRepo.Update(venta);
            await _ventaRepo.SaveChangesAsync();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(EnviarADepositoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(EnviarADepositoAsync), ex.Message);
            throw;
        }
    }

    private static PagoVentaDto MapPagoVentaDto(PagoVenta p) => new(
        p.Id, p.FormaPagoId, p.FormaPago?.Nombre ?? "",
        p.Monto, p.PorcentajeRecargo, p.Recargo, p.TotalACobrar);

    private static VentaDto ToDto(Venta v)
    {
        var pagos = v.Pagos.Any()
            ? v.Pagos.Select(MapPagoVentaDto).ToList()
            : null;

        return new VentaDto(
            v.Id,
            v.NumeroTicket,
            v.FechaCreacion,
            v.Tipo,
            v.Estado,
            v.ClienteId,
            v.NombreCliente,
            v.TelefonoCliente,
            v.DireccionEntrega,
            v.ZonaId,
            v.Zona?.Nombre,
            v.Subtotal,
            v.Descuento,
            v.Recargo,
            v.Total,
            v.FormaPagoId,
            v.FormaPago?.Nombre,
            v.RepartidorId,
            v.Repartidor?.Nombre,
            v.FechaAsignacion,
            v.FechaEntrega,
            v.NotasEntrega,
            v.NotaInterna,
            v.TipoFactura,
            v.FechaProgramada,
            v.FechaProgramada != null,
            v.EstaPago,
            v.LocalId,
            v.Local?.Nombre,
            v.UsuarioId,
            v.Usuario?.NombreCompleto,
            v.Observaciones,
            v.Lineas.Select(l => new LineaVentaDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList(),
            pagos,
            v.ComprobanteEntrega,
            v.MotivoCancelacion,
            v.RepartoZonaId,
            v.MontoNeto,
            v.MontoIVA,
            v.FechaEnvioDeposito,
            v.VencidoDeposito);
    }
}
