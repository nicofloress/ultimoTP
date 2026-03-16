namespace BurgerShop.Application.Logistica.DTOs;

public record RendicionDto(
    int Id,
    int RepartidorId,
    string RepartidorNombre,
    DateTime Fecha,
    decimal TotalEfectivo,
    decimal TotalTransferencia,
    decimal TotalNoEntregado,
    int CantidadEntregados,
    int CantidadNoEntregados,
    decimal EfectivoDeclarado,
    decimal Diferencia,
    string? Observaciones,
    bool Aprobada,
    DateTime? FechaAprobacion,
    List<RendicionDetalleDto> Detalles,
    List<RendicionZonaDto> Zonas);

public record RendicionDetalleDto(
    int Id,
    int PedidoId,
    string NumeroTicket,
    string Estado,
    string? FormaPago,
    decimal Total);

public record CrearRendicionDto(
    int RepartidorId,
    decimal EfectivoDeclarado,
    string? Observaciones);

public record AprobarRendicionDto(
    bool Aprobada,
    string? Observaciones);

public record RendicionZonaDto(
    int ZonaId,
    string ZonaNombre,
    int TotalPedidos,
    int TotalEntregados,
    int TotalNoEntregados,
    int TotalCancelados);

public record EstadoRepartoRepartidorDto(
    bool ZonasFinalizadas,
    List<RendicionZonaDto> Zonas);
