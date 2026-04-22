using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.DTOs;

public record VentaDto(
    int Id,
    string NumeroTicket,
    DateTime FechaCreacion,
    TipoVenta Tipo,
    EstadoVenta Estado,
    int? ClienteId,
    string? NombreCliente,
    string? TelefonoCliente,
    string? DireccionEntrega,
    int? ZonaId,
    string? ZonaNombre,
    decimal Subtotal,
    decimal Descuento,
    decimal Recargo,
    decimal Total,
    int? FormaPagoId,
    string? FormaPagoNombre,
    int? RepartidorId,
    string? RepartidorNombre,
    DateTime? FechaAsignacion,
    DateTime? FechaEntrega,
    string? NotasEntrega,
    string? NotaInterna,
    TipoFactura TipoFactura,
    DateTime? FechaProgramada,
    bool EsProgramado,
    bool EstaPago,
    int? LocalId,
    string? LocalNombre,
    int? UsuarioId,
    string? UsuarioNombre,
    string? Observaciones,
    List<LineaVentaDto> Lineas,
    List<PagoVentaDto>? Pagos = null,
    string? ComprobanteEntrega = null,
    string? MotivoCancelacion = null,
    int? RepartoZonaId = null,
    decimal MontoNeto = 0,
    decimal MontoIVA = 0,
    DateTime? FechaEnvioDeposito = null,
    bool VencidoDeposito = false,
    int? CierreCajaId = null);

public record LineaVentaDto(
    int Id,
    int? ProductoId,
    int? ComboId,
    string Descripcion,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal,
    string? Notas);

public record CrearVentaDto(
    TipoVenta Tipo,
    int? ClienteId,
    string? NombreCliente,
    string? TelefonoCliente,
    string? DireccionEntrega,
    int? ZonaId,
    decimal Descuento,
    int? FormaPagoId,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<CrearLineaVentaDto> Lineas,
    DateTime? FechaProgramada = null,
    bool EstaPago = false,
    List<CrearPagoVentaDto>? Pagos = null,
    int? LocalId = null,
    string? Observaciones = null);

public record CrearLineaVentaDto(
    int? ProductoId,
    int? ComboId,
    int Cantidad,
    decimal PrecioUnitario,
    string? Notas);

public record CrearPagoVentaDto(int FormaPagoId, decimal Monto);

public record PagoVentaDto(
    int Id,
    int FormaPagoId,
    string FormaPagoNombre,
    decimal Monto,
    decimal PorcentajeRecargo,
    decimal Recargo,
    decimal TotalACobrar);

public record ActualizarVentaDto(
    string? NombreCliente,
    string? TelefonoCliente,
    string? DireccionEntrega,
    int? ZonaId,
    decimal Descuento,
    int? FormaPagoId,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<CrearLineaVentaDto> Lineas,
    DateTime? FechaProgramada = null,
    bool EstaPago = false,
    List<CrearPagoVentaDto>? Pagos = null,
    int? ClienteId = null);

/// <summary>
/// DTO para actualizar solo datos de la venta (cliente, domicilio, zona, nota, estado de pago)
/// sin tocar líneas, descuento, estado o forma de pago. Funciona en cualquier estado.
/// </summary>
public record ActualizarDatosPedidoDto(
    int? ClienteId,
    string? NombreCliente,
    string? TelefonoCliente,
    string? DireccionEntrega,
    int? ZonaId,
    string? NotaInterna,
    bool? EstaPago);

public record CambiarEstadoDto(EstadoVenta NuevoEstado);
public record CambiarEstadoPedidoDto(EstadoVenta NuevoEstado, string? Motivo = null, int? FormaPagoId = null, List<PagoEntregaDto>? Pagos = null);
public record CancelarVentaDto(string Motivo);

public record AsignarEntregaDto(int VentaId, int RepartidorId);

public record MarcarEntregadoDto(
    string? Notas = null,
    int? FormaPagoId = null,
    string? ComprobanteBase64 = null,
    List<PagoEntregaDto>? Pagos = null);

public record PagoEntregaDto(int FormaPagoId, decimal Monto);

public record EmpezarRepartoDto(List<AsignacionZonaDto> Asignaciones);
public record AsignacionZonaDto(int ZonaId, int RepartidorId, decimal MontoInicialCambio = 0);
public record FinalizarRepartoDto(int ZonaId, int RepartidorId);

public record TicketDto(
    string NumeroTicket,
    DateTime Fecha,
    TipoVenta Tipo,
    string? NombreCliente,
    string? DireccionEntrega,
    string? ZonaNombre,
    List<LineaVentaDto> Lineas,
    decimal Subtotal,
    decimal Descuento,
    decimal Recargo,
    decimal Total,
    string? FormaPagoNombre,
    string? NotaInterna,
    TipoFactura TipoFactura,
    List<PagoVentaDto>? Pagos = null);

public record VentaStatsDto(
    int VentasHoy,
    int VentasAyer,
    decimal PorcentajeVariacionAyer,
    int VentasUltimos7Dias,
    decimal PorcentajeVariacion7Dias,
    int VentasAnioAnterior,
    decimal PorcentajeVariacionAnio,
    int TotalVentasFecha,
    decimal TicketPromedio,
    decimal TotalBruto);
