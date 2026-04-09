using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Finanzas;

namespace BurgerShop.Application.Finanzas.Services;

public class CierreCajaService : ICierreCajaService
{
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly IVentaRepository _ventaRepo;

    public CierreCajaService(ICierreCajaRepository cajaRepo, IVentaRepository ventaRepo)
    {
        _cajaRepo = cajaRepo;
        _ventaRepo = ventaRepo;
    }

    public async Task<CierreCajaDto?> GetCajaAbiertaAsync(int? localId = null)
    {
        var caja = await _cajaRepo.GetCajaAbiertaAsync(localId);
        if (caja is null) return null;

        var ventas = await _ventaRepo.GetByCierreCajaAsync(caja.Id);
        return ToDto(caja, ventas.ToList());
    }

    public async Task<CierreCajaDto> AbrirCajaAsync(AbrirCajaDto dto)
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

    public async Task<CierreCajaDto?> CerrarCajaAsync(int id, CerrarCajaDto dto)
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

        // Guardar datos de domicilio al momento del cierre para no recalcular en el historial
        var ventasDomicilioAlCierre = ventas.Where(v => v.Tipo == TipoVenta.Domicilio).ToList();
        caja.CantidadDomicilio = ventasDomicilioAlCierre.Count;
        caja.TotalDomicilio = ventasDomicilioAlCierre.Sum(v => v.Total);

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

    public async Task<IEnumerable<CierreCajaDto>> GetHistorialAsync(int? localId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        var cajas = await _cajaRepo.GetHistorialAsync(50, localId, fechaDesde, fechaHasta);
        return cajas.Select(c => ToDto(c, new List<Venta>()));
    }

    public async Task<CierreCajaDto?> GetByIdAsync(int id)
    {
        var caja = await _cajaRepo.GetByIdConDetallesAsync(id);
        if (caja is null) return null;

        var ventas = await _ventaRepo.GetByCierreCajaAsync(id);
        return ToDto(caja, ventas.ToList());
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

        var totalVentas = detalles.Any()
            ? detalles.Sum(d => d.MontoTotal)
            : ventas.Sum(v => v.Total);

        // Para caja abierta: calcular en vivo desde las ventas cargadas.
        // Para caja cerrada (historial): usar los campos persistidos en la entidad.
        int cantidadDomicilio;
        decimal totalDomicilio;
        int cantidadVentas;

        if (caja.Estado == EstadoCaja.Abierta)
        {
            var ventasDomicilio = ventas.Where(v => v.Tipo == TipoVenta.Domicilio).ToList();
            cantidadDomicilio = ventasDomicilio.Count;
            totalDomicilio = ventasDomicilio.Sum(v => v.Total);
            cantidadVentas = ventas.Count;
        }
        else
        {
            cantidadDomicilio = caja.CantidadDomicilio;
            totalDomicilio = caja.TotalDomicilio;
            cantidadVentas = ventas.Any() ? ventas.Count : 0;
        }

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
            cantidadVentas,
            totalVentas,
            totalDomicilio,
            cantidadDomicilio);
    }
}
