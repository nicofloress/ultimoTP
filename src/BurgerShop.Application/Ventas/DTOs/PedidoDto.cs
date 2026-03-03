using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.DTOs;

public record PedidoDto(
    int Id, string NumeroTicket, DateTime FechaCreacion,
    TipoPedido Tipo, EstadoPedido Estado,
    string? NombreCliente, string? TelefonoCliente, string? DireccionEntrega,
    int? ZonaId, string? ZonaNombre,
    decimal Subtotal, decimal Descuento, decimal Total,
    int? RepartidorId, string? RepartidorNombre,
    DateTime? FechaAsignacion, DateTime? FechaEntrega, string? NotasEntrega,
    List<LineaPedidoDto> Lineas);

public record LineaPedidoDto(
    int Id, int? ProductoId, int? ComboId, string Descripcion,
    int Cantidad, decimal PrecioUnitario, decimal Subtotal, string? Notas);

public record CrearPedidoDto(
    TipoPedido Tipo,
    string? NombreCliente, string? TelefonoCliente, string? DireccionEntrega,
    int? ZonaId, decimal Descuento,
    List<CrearLineaPedidoDto> Lineas);

public record CrearLineaPedidoDto(
    int? ProductoId, int? ComboId,
    int Cantidad, decimal PrecioUnitario, string? Notas);

public record CambiarEstadoDto(EstadoPedido NuevoEstado);

public record AsignarEntregaDto(int PedidoId, int RepartidorId);

public record TicketDto(
    string NumeroTicket, DateTime Fecha, TipoPedido Tipo,
    string? NombreCliente, string? DireccionEntrega, string? ZonaNombre,
    List<LineaPedidoDto> Lineas,
    decimal Subtotal, decimal Descuento, decimal Total);
