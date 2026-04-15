using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Finanzas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Finanzas.Services;

public class CierreCajaService : ICierreCajaService
{
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly IVentaRepository _ventaRepo;
    private readonly ILogger<CierreCajaService> _logger;

    public CierreCajaService(
        ICierreCajaRepository cajaRepo,
        IVentaRepository ventaRepo,
        ILogger<CierreCajaService> logger)
    {
        _cajaRepo = cajaRepo;
        _ventaRepo = ventaRepo;
        _logger = logger;
    }

    public async Task<CierreCajaDto?> GetCajaAbiertaAsync(int? localId = null)
    {
        try
        {
            var caja = await _cajaRepo.GetCajaAbiertaAsync(localId);
            if (caja is null) return null;

            var ventas = await _ventaRepo.GetByCierreCajaAsync(caja.Id);
            return ToDto(caja, ventas.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetCajaAbiertaAsync), ex.Message);
            throw;
        }
    }

    public async Task<CierreCajaDto> AbrirCajaAsync(AbrirCajaDto dto)
    {
        try
        {
            var cajaExistente = await _cajaRepo.GetCajaAbiertaAsync(dto.LocalId);
            if (cajaExistente is not null)
                throw new InvalidOperationException("Ya existe una caja abierta para este local. Debe cerrarla antes de abrir una nueva.");

            var nuevaCaja = new CierreCaja
            {
                FechaApertura = DateTime.Now,
                MontoInicial = dto.MontoInicial,
                Observaciones = dto.Observaciones,
                LocalId = dto.LocalId,
                Estado = EstadoCaja.Abierta
            };

            await _cajaRepo.AddAsync(nuevaCaja);
            await _cajaRepo.SaveChangesAsync();

            return ToDto(nuevaCaja, new List<Venta>());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(AbrirCajaAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(AbrirCajaAsync), ex.Message);
            throw;
        }
    }

    public async Task<CierreCajaDto?> CerrarCajaAsync(int id, CerrarCajaDto dto)
    {
        try
        {
            var caja = await _cajaRepo.GetByIdConDetallesAsync(id);
            if (caja is null) return null;

            var ventas = (await _ventaRepo.GetByCierreCajaAsync(id)).ToList();

            var totalesPorFormaPago = new Dictionary<int, (decimal monto, int cantidad)>();

            foreach (var venta in ventas)
            {
                if (venta.Pagos.Any())
                {
                    foreach (var pago in venta.Pagos)
                    {
                        if (totalesPorFormaPago.TryGetValue(pago.FormaPagoId, out var existente))
                            totalesPorFormaPago[pago.FormaPagoId] = (existente.monto + pago.TotalACobrar, existente.cantidad + 1);
                        else
                            totalesPorFormaPago[pago.FormaPagoId] = (pago.TotalACobrar, 1);
                    }
                }
                else if (venta.FormaPagoId.HasValue)
                {
                    var formaPagoId = venta.FormaPagoId.Value;
                    if (totalesPorFormaPago.TryGetValue(formaPagoId, out var existente))
                        totalesPorFormaPago[formaPagoId] = (existente.monto + venta.Total, existente.cantidad + 1);
                    else
                        totalesPorFormaPago[formaPagoId] = (venta.Total, 1);
                }
            }

            caja.Detalles.Clear();

            foreach (var kvp in totalesPorFormaPago)
            {
                caja.Detalles.Add(new CierreCajaDetalle
                {
                    FormaPagoId = kvp.Key,
                    MontoTotal = kvp.Value.monto,
                    CantidadOperaciones = kvp.Value.cantidad
                });
            }

            // Guardar desgloses al momento del cierre para no recalcular en el historial
            var ventasCtaCteCierre = ventas.Where(v => v.FormaPago?.Nombre == "Cuenta Corriente").ToList();
            var ctaCteIdsCierre = new HashSet<int>(ventasCtaCteCierre.Select(v => v.Id));
            var ventasMostradorCierre = ventas.Where(v => v.Tipo == TipoVenta.Mostrador && !ctaCteIdsCierre.Contains(v.Id)).ToList();
            var ventasDomicilioCierre = ventas.Where(v => v.Tipo == TipoVenta.Domicilio && !ctaCteIdsCierre.Contains(v.Id)).ToList();

            caja.CantidadMostrador = ventasMostradorCierre.Count;
            caja.TotalMostrador = ventasMostradorCierre.Sum(v => v.Total);
            caja.CantidadDomicilio = ventasDomicilioCierre.Count;
            caja.TotalDomicilio = ventasDomicilioCierre.Sum(v => v.Total);
            caja.CantidadCtaCte = ventasCtaCteCierre.Count;
            caja.TotalCtaCte = ventasCtaCteCierre.Sum(v => v.Total);

            var sumaTotalVentas = totalesPorFormaPago.Values.Sum(v => v.monto);
            caja.MontoFinal = caja.MontoInicial + sumaTotalVentas;
            caja.Estado = EstadoCaja.Cerrada;
            caja.FechaCierre = DateTime.Now;
            caja.Observaciones = dto.Observaciones ?? caja.Observaciones;

            _cajaRepo.Update(caja);
            await _cajaRepo.SaveChangesAsync();

            var cajaActualizada = await _cajaRepo.GetByIdConDetallesAsync(id);
            return ToDto(cajaActualizada!, ventas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CerrarCajaAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<CierreCajaDto>> GetHistorialAsync(int? localId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        try
        {
            var cajas = await _cajaRepo.GetHistorialAsync(50, localId, fechaDesde, fechaHasta);
            return cajas.Select(c => ToDto(c, new List<Venta>()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetHistorialAsync), ex.Message);
            throw;
        }
    }

    public async Task<CierreCajaDto?> GetByIdAsync(int id)
    {
        try
        {
            var caja = await _cajaRepo.GetByIdConDetallesAsync(id);
            if (caja is null) return null;

            var ventas = await _ventaRepo.GetByCierreCajaAsync(id);
            return ToDto(caja, ventas.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    private static CierreCajaDto ToDto(CierreCaja caja, List<Venta> ventas)
    {
        List<CierreCajaDetalleDto> detalles;

        if (caja.Detalles.Any())
        {
            // Caja cerrada: usar detalles persistidos
            detalles = caja.Detalles.Select(d => new CierreCajaDetalleDto(
                d.Id,
                d.FormaPagoId,
                d.FormaPago?.Nombre ?? string.Empty,
                d.MontoTotal,
                d.CantidadOperaciones)).ToList();
        }
        else
        {
            // Caja abierta: calcular detalles en vivo desde las ventas
            var totalesPorFormaPago = new Dictionary<int, (string nombre, decimal monto, int cantidad)>();

            foreach (var venta in ventas)
            {
                // Pedidos domicilio sin pagar (que no son Cta Cte): se cobran al entregar, no se cuentan aún
                var esCtaCte = venta.FormaPago?.Nombre == "Cuenta Corriente";
                if (!venta.EstaPago && !esCtaCte)
                    continue;

                if (venta.Pagos.Any())
                {
                    foreach (var pago in venta.Pagos)
                    {
                        var nombre = pago.FormaPago?.Nombre ?? string.Empty;
                        if (totalesPorFormaPago.TryGetValue(pago.FormaPagoId, out var existente))
                            totalesPorFormaPago[pago.FormaPagoId] = (existente.nombre, existente.monto + pago.TotalACobrar, existente.cantidad + 1);
                        else
                            totalesPorFormaPago[pago.FormaPagoId] = (nombre, pago.TotalACobrar, 1);
                    }
                }
                else if (venta.FormaPagoId.HasValue)
                {
                    var formaPagoId = venta.FormaPagoId.Value;
                    var nombre = venta.FormaPago?.Nombre ?? string.Empty;
                    if (totalesPorFormaPago.TryGetValue(formaPagoId, out var existente))
                        totalesPorFormaPago[formaPagoId] = (existente.nombre, existente.monto + venta.Total, existente.cantidad + 1);
                    else
                        totalesPorFormaPago[formaPagoId] = (nombre, venta.Total, 1);
                }
            }

            detalles = totalesPorFormaPago.Select(kvp => new CierreCajaDetalleDto(
                0,
                kvp.Key,
                kvp.Value.nombre,
                kvp.Value.monto,
                kvp.Value.cantidad)).ToList();
        }

        var totalGeneral = detalles.Any()
            ? detalles.Sum(d => d.MontoTotal)
            : ventas.Sum(v => v.Total);

        // Calcular desglose por tipo
        int cantidadMostrador, cantidadDomicilio, cantidadCtaCte, cantidadTotal;
        decimal totalMostrador, totalDomicilio, totalCtaCte;

        if (caja.Estado == EstadoCaja.Abierta)
        {
            // Cta Cte: ventas cuya forma de pago es "Cuenta Corriente"
            var ctaCte = ventas.Where(v => v.FormaPago?.Nombre == "Cuenta Corriente").ToList();
            var ctaCteIds = new HashSet<int>(ctaCte.Select(v => v.Id));
            var mostrador = ventas.Where(v => v.Tipo == TipoVenta.Mostrador && !ctaCteIds.Contains(v.Id)).ToList();
            var domicilio = ventas.Where(v => v.Tipo == TipoVenta.Domicilio && !ctaCteIds.Contains(v.Id)).ToList();

            cantidadMostrador = mostrador.Count;
            totalMostrador = mostrador.Sum(v => v.Total);
            cantidadDomicilio = domicilio.Count;
            totalDomicilio = domicilio.Sum(v => v.Total);
            cantidadCtaCte = ctaCte.Count;
            totalCtaCte = ctaCte.Sum(v => v.Total);
            cantidadTotal = ventas.Count;
        }
        else
        {
            cantidadMostrador = caja.CantidadMostrador;
            totalMostrador = caja.TotalMostrador;
            cantidadDomicilio = caja.CantidadDomicilio;
            totalDomicilio = caja.TotalDomicilio;
            cantidadCtaCte = caja.CantidadCtaCte;
            totalCtaCte = caja.TotalCtaCte;
            cantidadTotal = cantidadMostrador + cantidadDomicilio + cantidadCtaCte;
        }

        // Calcular totales IVA desde las ventas de la caja
        var totalNetoVentas = Math.Round(ventas.Sum(v => v.MontoNeto), 2);
        var totalIVAVentas = Math.Round(ventas.Sum(v => v.MontoIVA), 2);

        return new CierreCajaDto(
            caja.Id,
            caja.FechaApertura,
            caja.FechaCierre,
            caja.MontoInicial,
            caja.MontoFinal,
            caja.Estado,
            caja.Observaciones,
            caja.UsuarioId,
            caja.LocalId,
            caja.Local?.Nombre,
            detalles,
            cantidadTotal,
            totalGeneral,
            cantidadMostrador,
            totalMostrador,
            cantidadDomicilio,
            totalDomicilio,
            cantidadCtaCte,
            totalCtaCte,
            totalNetoVentas,
            totalIVAVentas);
    }
}
