using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.DTOs;

public record VentaDto(
    int Id,
    string NumeroVenta,
    DateTime Fecha,
    TipoVenta TipoVenta,
    int? ClienteId,
    string? NombreCliente,
    string? TelefonoCliente,
    int LocalId,
    string LocalNombre,
    int? PedidoId,
    string? NumeroTicket,
    int? FormaPagoId,
    string? FormaPagoNombre,
    decimal Subtotal,
    decimal Descuento,
    decimal Recargo,
    decimal Total,
    bool EstaPago,
    int? UsuarioId,
    string? UsuarioNombre,
    string? Observaciones,
    List<VentaDetalleDto> Detalles,
    List<PagoVentaDto>? Pagos = null);

public record VentaDetalleDto(
    int Id,
    int? ProductoId,
    int? ComboId,
    string Descripcion,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal,
    string? Notas);

public record PagoVentaDto(
    int Id,
    int FormaPagoId,
    string FormaPagoNombre,
    decimal Monto,
    decimal PorcentajeRecargo,
    decimal Recargo,
    decimal TotalACobrar);

public record CrearVentaDto(
    TipoVenta TipoVenta,
    int? ClienteId,
    string? NombreCliente,
    string? TelefonoCliente,
    int LocalId,
    int? FormaPagoId,
    decimal Descuento,
    string? Observaciones,
    bool EstaPago,
    List<CrearVentaDetalleDto> Detalles,
    List<CrearPagoVentaDto>? Pagos = null);

public record CrearVentaDetalleDto(
    int? ProductoId,
    int? ComboId,
    int Cantidad,
    decimal PrecioUnitario,
    string? Notas);

public record CrearPagoVentaDto(int FormaPagoId, decimal Monto);
