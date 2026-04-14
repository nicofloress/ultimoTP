namespace BurgerShop.Application.Inventario.DTOs;

public record MovimientoDto(
    int Id, DateTime FechaMovimiento, DateTime FechaProceso,
    int CodigoAccionId, string CodigoAccionCodigo, string CodigoAccionNombre, int Signo,
    int? ProductoId, string? ProductoNombre,
    int LocalId, string LocalNombre,
    decimal Cantidad, decimal PrecioUnitario, decimal MontoTotal,
    int? VentaId, string? NumeroTicket,
    int? UsuarioId, string? UsuarioNombre,
    string? Observaciones,
    string? ClienteNombre = null);

public record CrearMovimientoDto(
    int CodigoAccionId, int? ProductoId, int LocalId,
    decimal Cantidad, decimal PrecioUnitario,
    DateTime FechaMovimiento, string? Observaciones);

public record CrearDevolucionDto(
    int?     ProductoId,
    int?     ComboId,
    int      LocalId,
    decimal  Cantidad,
    decimal  PrecioUnitario,
    DateTime FechaMovimiento,
    string   Motivo,
    int?     ClienteId = null);
