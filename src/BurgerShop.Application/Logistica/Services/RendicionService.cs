using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Logistica;

namespace BurgerShop.Application.Logistica.Services;

public class RendicionService : IRendicionService
{
    private readonly IRendicionRepository _rendicionRepo;
    private readonly IPedidoRepository _pedidoRepo;

    public RendicionService(IRendicionRepository rendicionRepo, IPedidoRepository pedidoRepo)
    {
        _rendicionRepo = rendicionRepo;
        _pedidoRepo = pedidoRepo;
    }

    public async Task<RendicionDto> CrearRendicionAsync(CrearRendicionDto dto)
    {
        var hoy = DateTime.Today;

        // No debe poder crear si ya existe una rendicion del mismo repartidor para hoy
        var existente = await _rendicionRepo.GetByRepartidorFechaAsync(dto.RepartidorId, hoy);
        if (existente is not null)
            throw new InvalidOperationException("Ya existe una rendicion para este repartidor en el dia de hoy.");

        // Obtener pedidos del repartidor de hoy
        var pedidos = (await _pedidoRepo.GetByRepartidorHoyAsync(dto.RepartidorId)).ToList();

        // No debe poder crear si tiene pedidos EnCamino o Asignados
        var tienePendientes = pedidos.Any(p =>
            p.Estado == EstadoPedido.EnCamino || p.Estado == EstadoPedido.Asignado);
        if (tienePendientes)
            throw new InvalidOperationException("No se puede crear la rendicion. Existen pedidos en camino o asignados sin finalizar.");

        // Validar que todas las zonas de reparto esten finalizadas
        var repartosZona = await _pedidoRepo.GetRepartosZonaByRepartidorHoyAsync(dto.RepartidorId);
        if (repartosZona.Any(r => r.Estado == EstadoReparto.EnCurso))
            throw new InvalidOperationException("No se puede crear la rendicion. Hay zonas de reparto que aun no fueron finalizadas.");

        // Filtrar solo Entregados y NoEntregados
        var entregados = pedidos.Where(p => p.Estado == EstadoPedido.Entregado).ToList();
        var noEntregados = pedidos.Where(p => p.Estado == EstadoPedido.NoEntregado).ToList();

        // Calcular totales por forma de pago para entregados
        decimal totalEfectivo = 0;
        decimal totalTransferencia = 0;

        foreach (var pedido in entregados)
        {
            if (pedido.Pagos.Any())
            {
                foreach (var pago in pedido.Pagos)
                {
                    var nombreFormaPago = pago.FormaPago?.Nombre ?? "";
                    if (nombreFormaPago.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                        totalEfectivo += pago.TotalACobrar;
                    else
                        totalTransferencia += pago.TotalACobrar;
                }
            }
            else if (pedido.FormaPago is not null)
            {
                if (pedido.FormaPago.Nombre.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                    totalEfectivo += pedido.Total;
                else
                    totalTransferencia += pedido.Total;
            }
        }

        // Calcular total de no entregados
        decimal totalNoEntregado = noEntregados.Sum(p => p.Total);

        var rendicion = new RendicionRepartidor
        {
            RepartidorId = dto.RepartidorId,
            Fecha = DateTime.Now,
            TotalEfectivo = totalEfectivo,
            TotalTransferencia = totalTransferencia,
            TotalNoEntregado = totalNoEntregado,
            CantidadEntregados = entregados.Count,
            CantidadNoEntregados = noEntregados.Count,
            EfectivoDeclarado = dto.EfectivoDeclarado,
            Diferencia = dto.EfectivoDeclarado - totalEfectivo,
            Observaciones = dto.Observaciones,
            Aprobada = false
        };

        // Crear detalles para cada pedido (entregados + no entregados)
        foreach (var pedido in entregados)
        {
            string? formaPago = null;
            if (pedido.Pagos.Any())
            {
                // Si tiene pagos mixtos, indicar la forma de pago principal
                formaPago = string.Join(", ", pedido.Pagos.Select(p => p.FormaPago?.Nombre ?? "").Distinct());
            }
            else
            {
                formaPago = pedido.FormaPago?.Nombre;
            }

            rendicion.Detalles.Add(new RendicionDetalle
            {
                PedidoId = pedido.Id,
                NumeroTicket = pedido.NumeroTicket,
                Estado = "Entregado",
                FormaPago = formaPago,
                Total = pedido.Total
            });
        }

        foreach (var pedido in noEntregados)
        {
            rendicion.Detalles.Add(new RendicionDetalle
            {
                PedidoId = pedido.Id,
                NumeroTicket = pedido.NumeroTicket,
                Estado = "NoEntregado",
                FormaPago = pedido.FormaPago?.Nombre,
                Total = pedido.Total
            });
        }

        await _rendicionRepo.AddAsync(rendicion);
        await _rendicionRepo.SaveChangesAsync();

        // Recargar con detalles completos
        var creada = await _rendicionRepo.GetByIdConDetallesAsync(rendicion.Id);
        return ToDto(creada!, repartosZona);
    }

    public async Task<IEnumerable<RendicionDto>> GetByRepartidorAsync(int repartidorId)
    {
        var rendiciones = await _rendicionRepo.GetByRepartidorAsync(repartidorId);
        var result = new List<RendicionDto>();
        foreach (var r in rendiciones)
        {
            var zonas = await _pedidoRepo.GetRepartosZonaByRepartidorFechaAsync(r.RepartidorId, r.Fecha);
            result.Add(ToDto(r, zonas));
        }
        return result;
    }

    public async Task<IEnumerable<RendicionDto>> GetAllAsync(DateTime? fecha = null)
    {
        var rendiciones = await _rendicionRepo.GetAllConRepartidorAsync(fecha);
        var result = new List<RendicionDto>();
        foreach (var r in rendiciones)
        {
            var zonas = await _pedidoRepo.GetRepartosZonaByRepartidorFechaAsync(r.RepartidorId, r.Fecha);
            result.Add(ToDto(r, zonas));
        }
        return result;
    }

    public async Task<RendicionDto?> GetByIdAsync(int id)
    {
        var rendicion = await _rendicionRepo.GetByIdConDetallesAsync(id);
        if (rendicion is null) return null;
        var zonas = await _pedidoRepo.GetRepartosZonaByRepartidorFechaAsync(rendicion.RepartidorId, rendicion.Fecha);
        return ToDto(rendicion, zonas);
    }

    public async Task<RendicionDto?> AprobarAsync(int id, AprobarRendicionDto dto)
    {
        var rendicion = await _rendicionRepo.GetByIdConDetallesAsync(id);
        if (rendicion is null) return null;

        rendicion.Aprobada = dto.Aprobada;
        rendicion.FechaAprobacion = DateTime.Now;
        if (dto.Observaciones is not null)
            rendicion.Observaciones = dto.Observaciones;

        _rendicionRepo.Update(rendicion);
        await _rendicionRepo.SaveChangesAsync();

        var zonas = await _pedidoRepo.GetRepartosZonaByRepartidorFechaAsync(rendicion.RepartidorId, rendicion.Fecha);
        return ToDto(rendicion, zonas);
    }

    public async Task<EstadoRepartoRepartidorDto> GetEstadoRepartoAsync(int repartidorId)
    {
        var repartos = await _pedidoRepo.GetRepartosZonaByRepartidorHoyAsync(repartidorId);
        var zonasFinalizadas = repartos.Count > 0 && repartos.All(r => r.Estado == EstadoReparto.Finalizado);
        var zonas = repartos.Select(z => new RendicionZonaDto(
            z.ZonaId,
            z.Zona?.Nombre ?? string.Empty,
            z.TotalPedidos,
            z.TotalEntregados,
            z.TotalNoEntregados,
            z.TotalCancelados)).ToList();
        return new EstadoRepartoRepartidorDto(zonasFinalizadas, zonas);
    }

    private static RendicionDto ToDto(RendicionRepartidor r, List<RepartoZona> repartosZona)
    {
        var detalles = r.Detalles.Select(d => new RendicionDetalleDto(
            d.Id,
            d.PedidoId,
            d.NumeroTicket,
            d.Estado,
            d.FormaPago,
            d.Total)).ToList();

        var zonas = repartosZona.Select(z => new RendicionZonaDto(
            z.ZonaId,
            z.Zona?.Nombre ?? string.Empty,
            z.TotalPedidos,
            z.TotalEntregados,
            z.TotalNoEntregados,
            z.TotalCancelados)).ToList();

        return new RendicionDto(
            r.Id,
            r.RepartidorId,
            r.Repartidor?.Nombre ?? string.Empty,
            r.Fecha,
            r.TotalEfectivo,
            r.TotalTransferencia,
            r.TotalNoEntregado,
            r.CantidadEntregados,
            r.CantidadNoEntregados,
            r.EfectivoDeclarado,
            r.Diferencia,
            r.Observaciones,
            r.Aprobada,
            r.FechaAprobacion,
            detalles,
            zonas);
    }
}
