using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.DTOs;

public record PedidoDto(
    int Id, string NumeroTicket, DateTime FechaCreacion,
    TipoPedido Tipo, EstadoPedido Estado,
    int? ClienteId, string? NombreCliente, string? TelefonoCliente, string? DireccionEntrega,
    int? ZonaId, string? ZonaNombre,
    decimal Subtotal, decimal Descuento, decimal Recargo, decimal Total,
    int? FormaPagoId, string? FormaPagoNombre,
    int? RepartidorId, string? RepartidorNombre,
    DateTime? FechaAsignacion, DateTime? FechaEntrega, string? NotasEntrega,
    string? NotaInterna,
    TipoFactura TipoFactura,
    DateTime? FechaProgramada,
    bool EsProgramado,
    bool EstaPago,
    List<LineaPedidoDto> Lineas,
    List<PagoPedidoDto>? Pagos = null,
    string? ComprobanteEntrega = null);

public record LineaPedidoDto(
    int Id, int? ProductoId, int? ComboId, string Descripcion,
    int Cantidad, decimal PrecioUnitario, decimal Subtotal, string? Notas);

public record CrearPedidoDto(
    TipoPedido Tipo,
    int? ClienteId,
    string? NombreCliente, string? TelefonoCliente, string? DireccionEntrega,
    int? ZonaId, decimal Descuento,
    int? FormaPagoId,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<CrearLineaPedidoDto> Lineas,
    DateTime? FechaProgramada = null,
    bool EstaPago = false,
    List<CrearPagoPedidoDto>? Pagos = null);

public record CrearLineaPedidoDto(
    int? ProductoId, int? ComboId,
    int Cantidad, decimal PrecioUnitario, string? Notas);

public record CrearPagoPedidoDto(int FormaPagoId, decimal Monto);

public record PagoPedidoDto(
    int Id, int FormaPagoId, string FormaPagoNombre,
    decimal Monto, decimal PorcentajeRecargo, decimal Recargo, decimal TotalACobrar);

public record ActualizarPedidoDto(
    string? NombreCliente,
    string? TelefonoCliente,
    string? DireccionEntrega,
    int? ZonaId,
    decimal Descuento,
    int? FormaPagoId,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<CrearLineaPedidoDto> Lineas,
    DateTime? FechaProgramada = null,
    bool EstaPago = false,
    List<CrearPagoPedidoDto>? Pagos = null);

public record CambiarEstadoDto(EstadoPedido NuevoEstado);

public record AsignarEntregaDto(int PedidoId, int RepartidorId);

public record MarcarEntregadoDto(
    string? Notas = null,
    int? FormaPagoId = null,
    string? ComprobanteBase64 = null);

public record EmpezarRepartoDto(List<AsignacionZonaDto> Asignaciones);
public record AsignacionZonaDto(int ZonaId, int RepartidorId);

public record TicketDto(
    string NumeroTicket, DateTime Fecha, TipoPedido Tipo,
    string? NombreCliente, string? DireccionEntrega, string? ZonaNombre,
    List<LineaPedidoDto> Lineas,
    decimal Subtotal, decimal Descuento, decimal Recargo, decimal Total,
    string? FormaPagoNombre,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<PagoPedidoDto>? Pagos = null);
