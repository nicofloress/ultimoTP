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

/// <summary>
/// DTO para registrar una compra de mercadería expresada en bultos.
/// El servicio convierte bultos → paquetes usando UnidadesPorBulto del producto.
/// </summary>
public record CrearCompraDto(
    int      ProductoId,
    int      LocalId,
    int      CantidadBultos,      // Cantidad de cajas/bultos comprados
    decimal  PrecioPorBulto,      // Precio de cada bulto
    DateTime FechaMovimiento,
    string?  Observaciones,
    bool     ImpactarEnCaja);     // Si crear movimiento EGR_CMP en caja

/// <summary>
/// DTO para editar una compra existente identificada por el Id del movimiento ING_CMP.
/// </summary>
public record EditarCompraDto(
    int      CantidadBultos,
    decimal  PrecioPorBulto,
    DateTime FechaMovimiento,
    string?  Observaciones,
    bool     ImpactarEnCaja);

/// <summary>
/// DTO para registrar una transferencia de stock entre locales expresada en bultos.
/// El servicio convierte bultos → paquetes usando UnidadesPorBulto del producto.
/// </summary>
public record CrearTransferenciaDto(
    int      ProductoId,
    int      LocalOrigenId,
    int      LocalDestinoId,
    int      CantidadBultos,
    string?  Observaciones);
