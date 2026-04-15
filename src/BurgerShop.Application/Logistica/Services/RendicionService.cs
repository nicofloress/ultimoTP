using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Domain.Interfaces.Logistica;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Logistica.Services;

public class RendicionService : IRendicionService
{
    private readonly IRendicionRepository _rendicionRepo;
    private readonly IVentaRepository _ventaRepo;
    private readonly IMovimientoService _movimientoService;
    private readonly ICuentaCorrienteService _cuentaCorrienteService;
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly ILogger<RendicionService> _logger;

    public RendicionService(
        IRendicionRepository rendicionRepo,
        IVentaRepository ventaRepo,
        IMovimientoService movimientoService,
        ICuentaCorrienteService cuentaCorrienteService,
        ICierreCajaRepository cajaRepo,
        ILogger<RendicionService> logger)
    {
        _rendicionRepo = rendicionRepo;
        _ventaRepo = ventaRepo;
        _movimientoService = movimientoService;
        _cuentaCorrienteService = cuentaCorrienteService;
        _cajaRepo = cajaRepo;
        _logger = logger;
    }

    public async Task<RendicionDto> CrearRendicionAsync(CrearRendicionDto dto)
    {
        try
        {
            // Validar que no exista rendicion para este RepartoZona
            var existente = await _rendicionRepo.GetByRepartoZonaIdAsync(dto.RepartoZonaId);
            if (existente is not null)
                throw new InvalidOperationException("Ya existe una rendicion para este reparto.");

            // Obtener ventas del repartidor de hoy y filtrar solo las del RepartoZona
            var ventas = (await _ventaRepo.GetByRepartidorHoyAsync(dto.RepartidorId))
                .Where(v => v.RepartoZonaId == dto.RepartoZonaId)
                .ToList();

            // No debe poder crear si tiene ventas EnCamino o Asignadas en este reparto
            var tienePendientes = ventas.Any(v =>
                v.Estado == EstadoVenta.EnCamino || v.Estado == EstadoVenta.Asignado);
            if (tienePendientes)
                throw new InvalidOperationException("No se puede crear la rendicion. Existen ventas en camino o asignadas sin finalizar.");

            // Obtener el RepartoZona para verificar que está finalizado
            var repartosZona = await _ventaRepo.GetRepartosZonaByRepartidorHoyAsync(dto.RepartidorId);
            var repartoZona = repartosZona.FirstOrDefault(r => r.Id == dto.RepartoZonaId);
            if (repartoZona is null)
                throw new InvalidOperationException("No se encontro el reparto de zona especificado.");
            if (repartoZona.Estado == EstadoReparto.EnCurso)
                throw new InvalidOperationException("No se puede crear la rendicion. El reparto de zona aun no fue finalizado.");

            // Filtrar solo Entregadas y NoEntregadas
            var entregadas = ventas.Where(v => v.Estado == EstadoVenta.Entregado).ToList();
            var noEntregadas = ventas.Where(v => v.Estado == EstadoVenta.NoEntregado).ToList();

            // Calcular totales por forma de pago para entregadas
            decimal totalEfectivo = 0;
            decimal totalTransferencia = 0;
            decimal totalCuentaCorriente = 0;

            foreach (var venta in entregadas)
            {
                // Ventas de cuenta corriente: identificadas por la forma de pago
                if (venta.FormaPago?.Nombre == "Cuenta Corriente")
                {
                    totalCuentaCorriente += venta.Total;
                }
                else if (venta.Pagos.Any())
                {
                    foreach (var pago in venta.Pagos)
                    {
                        var nombreFormaPago = pago.FormaPago?.Nombre ?? "";
                        if (nombreFormaPago.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                            totalEfectivo += pago.TotalACobrar;
                        else
                            totalTransferencia += pago.TotalACobrar;
                    }
                }
                else if (venta.FormaPago is not null)
                {
                    if (venta.FormaPago.Nombre.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                        totalEfectivo += venta.Total;
                    else
                        totalTransferencia += venta.Total;
                }
            }

            // Calcular total de no entregadas
            decimal totalNoEntregado = noEntregadas.Sum(v => v.Total);

            var rendicion = new RendicionRepartidor
            {
                RepartidorId = dto.RepartidorId,
                RepartoZonaId = dto.RepartoZonaId,
                Fecha = DateTime.Now,
                TotalEfectivo = totalEfectivo,
                TotalTransferencia = totalTransferencia,
                TotalCuentaCorriente = totalCuentaCorriente,
                TotalNoEntregado = totalNoEntregado,
                CantidadEntregados = entregadas.Count,
                CantidadNoEntregados = noEntregadas.Count,
                EfectivoDeclarado = dto.EfectivoDeclarado,
                Diferencia = dto.EfectivoDeclarado - totalEfectivo,
                Observaciones = dto.Observaciones,
                Aprobada = false
            };

            // Crear detalles para cada venta (entregadas + no entregadas)
            foreach (var venta in entregadas)
            {
                string? formaPago = null;
                if (venta.Pagos.Any())
                {
                    formaPago = string.Join(", ", venta.Pagos.Select(p => p.FormaPago?.Nombre ?? "").Distinct());
                }
                else
                {
                    formaPago = venta.FormaPago?.Nombre;
                }

                rendicion.Detalles.Add(new RendicionDetalle
                {
                    VentaId = venta.Id,
                    NumeroTicket = venta.NumeroTicket,
                    Estado = "Entregado",
                    FormaPago = formaPago,
                    Total = venta.Total
                });
            }

            foreach (var venta in noEntregadas)
            {
                rendicion.Detalles.Add(new RendicionDetalle
                {
                    VentaId = venta.Id,
                    NumeroTicket = venta.NumeroTicket,
                    Estado = "NoEntregado",
                    FormaPago = venta.FormaPago?.Nombre,
                    Total = venta.Total
                });
            }

            await _rendicionRepo.AddAsync(rendicion);
            await _rendicionRepo.SaveChangesAsync();

            // Recargar con detalles completos
            var creada = await _rendicionRepo.GetByIdConDetallesAsync(rendicion.Id);
            return ToDto(creada!, new List<RepartoZona> { repartoZona });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(CrearRendicionAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CrearRendicionAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<RendicionDto>> GetByRepartidorAsync(int repartidorId)
    {
        try
        {
            var rendiciones = await _rendicionRepo.GetByRepartidorAsync(repartidorId);
            var result = new List<RendicionDto>();
            foreach (var r in rendiciones)
            {
                var zonas = await GetZonasParaRendicionAsync(r);
                result.Add(ToDto(r, zonas));
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByRepartidorAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<RendicionDto>> GetAllAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        try
        {
            var rendiciones = await _rendicionRepo.GetAllConRepartidorAsync(fechaDesde, fechaHasta);
            var result = new List<RendicionDto>();
            foreach (var r in rendiciones)
            {
                var zonas = await GetZonasParaRendicionAsync(r);
                result.Add(ToDto(r, zonas));
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<RendicionDto?> GetByIdAsync(int id)
    {
        try
        {
            var rendicion = await _rendicionRepo.GetByIdConDetallesAsync(id);
            if (rendicion is null) return null;
            var zonas = await GetZonasParaRendicionAsync(rendicion);
            return ToDto(rendicion, zonas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<RendicionDto?> AprobarAsync(int id, AprobarRendicionDto dto)
    {
        try
        {
            var rendicion = await _rendicionRepo.GetByIdConDetallesAsync(id);
            if (rendicion is null) return null;

            rendicion.Aprobada = dto.Aprobada;
            rendicion.FechaAprobacion = DateTime.Now;
            if (dto.Observaciones is not null)
                rendicion.Observaciones = dto.Observaciones;

            _rendicionRepo.Update(rendicion);
            await _rendicionRepo.SaveChangesAsync();

            // Al aprobar, generar movimientos de CAJA (ING_VTA) y vincular a caja abierta
            if (dto.Aprobada)
            {
                var ventasEntregadas = rendicion.Detalles
                    .Where(d => d.Estado == "Entregado")
                    .Select(d => d.VentaId)
                    .ToList();

                // Obtener las ventas para saber el localId y vincularlas a la caja
                foreach (var ventaId in ventasEntregadas)
                {
                    try
                    {
                        var venta = await _ventaRepo.GetByIdWithLineasAsync(ventaId);
                        var localId = venta?.LocalId ?? 1;

                        // Registrar movimiento de caja con el local correcto
                        await _movimientoService.RegistrarMovimientosVentaCajaAsync(ventaId, localId, null);

                        // Vincular la venta a la caja abierta del local (si hay una)
                        if (venta != null && venta.CierreCajaId == null)
                        {
                            var cajaAbierta = await _cajaRepo.GetCajaAbiertaAsync(localId);
                            if (cajaAbierta != null)
                            {
                                venta.CierreCajaId = cajaAbierta.Id;
                                _ventaRepo.Update(venta);
                                await _ventaRepo.SaveChangesAsync();
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // No bloquear la aprobación si falla un movimiento individual
                        _logger.LogWarning(ex, "AprobarAsync: fallo al registrar movimiento de caja para ventaId={VentaId}: {Message}", ventaId, ex.Message);
                    }
                }

                // Saldar cuentas corrientes si la venta fue cobrada en la entrega
                foreach (var ventaId in ventasEntregadas)
                {
                    try
                    {
                        await _cuentaCorrienteService.SaldarCargoPorVentaAsync(ventaId, null);
                    }
                    catch (Exception ex)
                    {
                        // No bloquear la aprobación
                        _logger.LogWarning(ex, "AprobarAsync: fallo al saldar cuenta corriente para ventaId={VentaId}: {Message}", ventaId, ex.Message);
                    }
                }
            }

            var zonas = await GetZonasParaRendicionAsync(rendicion);
            return ToDto(rendicion, zonas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(AprobarAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<RepartidorPendienteRendicionDto>> GetRepartidoresPendientesAsync()
    {
        try
        {
            // Obtener todos los repartos de hoy que estan finalizados
            var repartosFinalizados = await _ventaRepo.GetRepartosZonaFinalizadosHoyAsync();

            if (!repartosFinalizados.Any())
                return Enumerable.Empty<RepartidorPendienteRendicionDto>();

            var resultado = new List<RepartidorPendienteRendicionDto>();

            // Iterar cada RepartoZona finalizado individualmente
            foreach (var reparto in repartosFinalizados)
            {
                // Saltar si ya tiene rendicion creada para este RepartoZona
                var rendicionExistente = await _rendicionRepo.GetByRepartoZonaIdAsync(reparto.Id);
                if (rendicionExistente is not null)
                    continue;

                // Obtener ventas de este repartidor hoy, filtradas por RepartoZonaId
                var ventas = (await _ventaRepo.GetByRepartidorHoyAsync(reparto.RepartidorId))
                    .Where(v => v.RepartoZonaId == reparto.Id)
                    .ToList();

                // Verificar que no tenga ventas activas en este reparto
                if (ventas.Any(v => v.Estado == EstadoVenta.Asignado || v.Estado == EstadoVenta.EnCamino))
                    continue;

                var entregadas = ventas.Where(v => v.Estado == EstadoVenta.Entregado).ToList();
                var noEntregadas = ventas.Where(v => v.Estado == EstadoVenta.NoEntregado).ToList();

                decimal totalEfectivo = 0;
                decimal totalTransferencia = 0;

                foreach (var venta in entregadas)
                {
                    if (venta.Pagos.Any())
                    {
                        foreach (var pago in venta.Pagos)
                        {
                            var nombreFormaPago = pago.FormaPago?.Nombre ?? "";
                            if (nombreFormaPago.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                                totalEfectivo += pago.TotalACobrar;
                            else
                                totalTransferencia += pago.TotalACobrar;
                        }
                    }
                    else if (venta.FormaPago is not null)
                    {
                        if (venta.FormaPago.Nombre.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                            totalEfectivo += venta.Total;
                        else
                            totalTransferencia += venta.Total;
                    }
                }

                decimal totalNoEntregado = noEntregadas.Sum(v => v.Total);

                var zonaDto = new RendicionZonaDto(
                    reparto.ZonaId,
                    reparto.Zona?.Nombre ?? string.Empty,
                    reparto.TotalVentas,
                    reparto.TotalEntregados,
                    reparto.TotalNoEntregados,
                    reparto.TotalCancelados);

                var nombreRepartidor = reparto.Repartidor?.Nombre ?? string.Empty;

                var ventasDto = ventas.Select(v =>
                {
                    string? formaPago = v.Pagos.Any()
                        ? v.Pagos.FirstOrDefault()?.FormaPago?.Nombre
                        : v.FormaPago?.Nombre;

                    return new PedidoPendienteRendicionDto(
                        v.Id,
                        v.NumeroTicket ?? "",
                        v.Estado.ToString(),
                        v.Cliente?.Nombre,
                        v.DireccionEntrega,
                        formaPago,
                        v.Total);
                }).ToList();

                resultado.Add(new RepartidorPendienteRendicionDto(
                    reparto.RepartidorId,
                    nombreRepartidor,
                    reparto.Id,
                    reparto.Zona?.Nombre ?? string.Empty,
                    new List<RendicionZonaDto> { zonaDto },
                    entregadas.Count,
                    noEntregadas.Count,
                    totalEfectivo,
                    totalTransferencia,
                    totalNoEntregado,
                    ventasDto,
                    reparto.Repartidor?.LocalId,
                    reparto.MontoInicialCambio));
            }

            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetRepartidoresPendientesAsync), ex.Message);
            throw;
        }
    }

    public async Task<EstadoRepartoRepartidorDto> GetEstadoRepartoAsync(int repartidorId)
    {
        try
        {
            var repartos = await _ventaRepo.GetRepartosZonaByRepartidorHoyAsync(repartidorId);
            var zonasFinalizadas = repartos.Count > 0 && repartos.All(r => r.Estado == EstadoReparto.Finalizado);
            var zonas = repartos.Select(z => new RendicionZonaDto(
                z.ZonaId,
                z.Zona?.Nombre ?? string.Empty,
                z.TotalVentas,
                z.TotalEntregados,
                z.TotalNoEntregados,
                z.TotalCancelados)).ToList();
            return new EstadoRepartoRepartidorDto(zonasFinalizadas, zonas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetEstadoRepartoAsync), ex.Message);
            throw;
        }
    }

    private async Task<List<RepartoZona>> GetZonasParaRendicionAsync(RendicionRepartidor r)
    {
        var todasZonas = await _ventaRepo.GetRepartosZonaByRepartidorFechaAsync(r.RepartidorId, r.Fecha);
        if (r.RepartoZonaId.HasValue)
            return todasZonas.Where(z => z.Id == r.RepartoZonaId.Value).ToList();
        return todasZonas;
    }

    private static RendicionDto ToDto(RendicionRepartidor r, List<RepartoZona> repartosZona)
    {
        var detalles = r.Detalles.Select(d => new RendicionDetalleDto(
            d.Id,
            d.VentaId,
            d.NumeroTicket,
            d.Estado,
            d.FormaPago,
            d.Total,
            d.Venta?.Cliente?.Nombre,
            d.Venta?.DireccionEntrega,
            d.Venta?.Zona?.Nombre)).ToList();

        var zonas = repartosZona.Select(z => new RendicionZonaDto(
            z.ZonaId,
            z.Zona?.Nombre ?? string.Empty,
            z.TotalVentas,
            z.TotalEntregados,
            z.TotalNoEntregados,
            z.TotalCancelados)).ToList();

        var montoInicialCambio = repartosZona.Sum(z => z.MontoInicialCambio);

        return new RendicionDto(
            r.Id,
            r.RepartidorId,
            r.Repartidor?.Nombre ?? string.Empty,
            r.Fecha,
            r.TotalEfectivo,
            r.TotalTransferencia,
            r.TotalCuentaCorriente,
            r.TotalNoEntregado,
            r.CantidadEntregados,
            r.CantidadNoEntregados,
            r.EfectivoDeclarado,
            r.Diferencia,
            r.Observaciones,
            r.Aprobada,
            r.FechaAprobacion,
            detalles,
            zonas,
            r.RepartoZonaId,
            r.Repartidor?.LocalId,
            montoInicialCambio);
    }
}
