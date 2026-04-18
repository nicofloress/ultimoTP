namespace BurgerShop.Application.Logistica.DTOs;

public record RendicionDto(
    int Id,
    int RepartidorId,
    string RepartidorNombre,
    DateTime Fecha,
    decimal TotalEfectivo,
    decimal TotalTransferencia,
    decimal TotalCuentaCorriente,
    decimal TotalNoEntregado,
    int CantidadEntregados,
    int CantidadNoEntregados,
    decimal EfectivoDeclarado,
    decimal Diferencia,
    string? Observaciones,
    bool Aprobada,
    DateTime? FechaAprobacion,
    int? ResultadoRevision,
    List<RendicionDetalleDto> Detalles,
    List<RendicionZonaDto> Zonas,
    int? RepartoZonaId,
    int? RepartidorLocalId = null,
    decimal MontoInicialCambio = 0);

public record RendicionDetalleDto(
    int Id,
    int VentaId,
    string NumeroTicket,
    string Estado,
    string? FormaPago,
    decimal Total,
    string? NombreCliente,
    string? DireccionEntrega,
    string? ZonaNombre);

public record CrearRendicionDto(
    int RepartidorId,
    int RepartoZonaId,
    decimal EfectivoDeclarado,
    string? Observaciones);

public record AprobarRendicionDto(
    bool Aprobada,
    string? Observaciones,
    int? ResultadoRevision = null);

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

public record PedidoPendienteRendicionDto(
    int Id,
    string NumeroTicket,
    string Estado,
    string? NombreCliente,
    string? DireccionEntrega,
    string? FormaPago,
    decimal Total);

public record RepartidorPendienteRendicionDto(
    int RepartidorId,
    string RepartidorNombre,
    int RepartoZonaId,
    string ZonaNombre,
    List<RendicionZonaDto> Zonas,
    int TotalEntregados,
    int TotalNoEntregados,
    decimal TotalEfectivo,
    decimal TotalTransferencia,
    decimal TotalNoEntregado,
    List<PedidoPendienteRendicionDto> Pedidos,
    int? RepartidorLocalId = null,
    decimal MontoInicialCambio = 0);
