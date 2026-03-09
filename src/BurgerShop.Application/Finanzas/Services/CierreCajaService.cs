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
    private readonly IPedidoRepository _pedidoRepo;

    public CierreCajaService(ICierreCajaRepository cajaRepo, IPedidoRepository pedidoRepo)
    {
        _cajaRepo = cajaRepo;
        _pedidoRepo = pedidoRepo;
    }

    public async Task<CierreCajaDto?> GetCajaAbiertaAsync()
    {
        var caja = await _cajaRepo.GetCajaAbiertaAsync();
        if (caja is null) return null;

        var pedidos = await _pedidoRepo.GetByCierreCajaAsync(caja.Id);
        return ToDto(caja, pedidos.ToList());
    }

    public async Task<CierreCajaDto> AbrirCajaAsync(AbrirCajaDto dto)
    {
        var cajaExistente = await _cajaRepo.GetCajaAbiertaAsync();
        if (cajaExistente is not null)
            throw new InvalidOperationException("Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.");

        var nuevaCaja = new CierreCaja
        {
            FechaApertura = DateTime.Now,
            MontoInicial = dto.MontoInicial,
            Observaciones = dto.Observaciones,
            Estado = EstadoCaja.Abierta
        };

        await _cajaRepo.AddAsync(nuevaCaja);
        await _cajaRepo.SaveChangesAsync();

        return ToDto(nuevaCaja, new List<Pedido>());
    }

    public async Task<CierreCajaDto?> CerrarCajaAsync(int id, CerrarCajaDto dto)
    {
        var caja = await _cajaRepo.GetByIdConDetallesAsync(id);
        if (caja is null) return null;

        // Obtener pedidos de esta caja con sus pagos completos
        var pedidos = (await _pedidoRepo.GetByCierreCajaAsync(id)).ToList();

        // Calcular totales por forma de pago
        // Pedidos con un único FormaPagoId (pago simple)
        var totalesPorFormaPago = new Dictionary<int, (decimal monto, int cantidad)>();

        foreach (var pedido in pedidos)
        {
            if (pedido.Pagos.Any())
            {
                // Pago dividido: usar los registros de PagoPedido
                foreach (var pago in pedido.Pagos)
                {
                    if (totalesPorFormaPago.TryGetValue(pago.FormaPagoId, out var existente))
                        totalesPorFormaPago[pago.FormaPagoId] = (existente.monto + pago.TotalACobrar, existente.cantidad + 1);
                    else
                        totalesPorFormaPago[pago.FormaPagoId] = (pago.TotalACobrar, 1);
                }
            }
            else if (pedido.FormaPagoId.HasValue)
            {
                // Pago simple: usar el Total del pedido
                var formaPagoId = pedido.FormaPagoId.Value;
                if (totalesPorFormaPago.TryGetValue(formaPagoId, out var existente))
                    totalesPorFormaPago[formaPagoId] = (existente.monto + pedido.Total, existente.cantidad + 1);
                else
                    totalesPorFormaPago[formaPagoId] = (pedido.Total, 1);
            }
        }

        // Eliminar detalles anteriores si los hay (por si se reabre o recalcula)
        caja.Detalles.Clear();

        // Crear detalle por cada forma de pago
        foreach (var kvp in totalesPorFormaPago)
        {
            caja.Detalles.Add(new CierreCajaDetalle
            {
                FormaPagoId = kvp.Key,
                MontoTotal = kvp.Value.monto,
                CantidadOperaciones = kvp.Value.cantidad
            });
        }

        // MontoFinal = suma de todos los montos de detalles + MontoInicial
        var sumaTotalVentas = totalesPorFormaPago.Values.Sum(v => v.monto);
        caja.MontoFinal = caja.MontoInicial + sumaTotalVentas;
        caja.Estado = EstadoCaja.Cerrada;
        caja.FechaCierre = DateTime.Now;
        caja.Observaciones = dto.Observaciones ?? caja.Observaciones;

        _cajaRepo.Update(caja);
        await _cajaRepo.SaveChangesAsync();

        // Recargar con detalles completos (FormaPago incluido)
        var cajaActualizada = await _cajaRepo.GetByIdConDetallesAsync(id);
        return ToDto(cajaActualizada!, pedidos);
    }

    public async Task<IEnumerable<CierreCajaDto>> GetHistorialAsync()
    {
        var cajas = await _cajaRepo.GetHistorialAsync();
        // Para el historial no cargamos los pedidos completos por performance
        return cajas.Select(c => ToDto(c, new List<Pedido>()));
    }

    public async Task<CierreCajaDto?> GetByIdAsync(int id)
    {
        var caja = await _cajaRepo.GetByIdConDetallesAsync(id);
        if (caja is null) return null;

        var pedidos = await _pedidoRepo.GetByCierreCajaAsync(id);
        return ToDto(caja, pedidos.ToList());
    }

    private static CierreCajaDto ToDto(CierreCaja caja, List<Pedido> pedidos)
    {
        var detalles = caja.Detalles.Select(d => new CierreCajaDetalleDto(
            d.Id,
            d.FormaPagoId,
            d.FormaPago?.Nombre ?? string.Empty,
            d.MontoTotal,
            d.CantidadOperaciones)).ToList();

        var totalVentas = detalles.Sum(d => d.MontoTotal);

        return new CierreCajaDto(
            caja.Id,
            caja.FechaApertura,
            caja.FechaCierre,
            caja.MontoInicial,
            caja.MontoFinal,
            caja.Estado,
            caja.Observaciones,
            caja.UsuarioId,
            detalles,
            pedidos.Count,
            totalVentas);
    }
}
