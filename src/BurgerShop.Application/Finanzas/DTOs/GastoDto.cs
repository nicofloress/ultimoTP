namespace BurgerShop.Application.Finanzas.DTOs;

public record GastoDto(
    int Id,
    string Nombre,
    DateTime FechaGasto,
    DateTime? FechaVencimiento,
    string? Categoria,
    string? Proveedor,
    string? Etiqueta,
    int? FormaPagoId,
    string? FormaPagoNombre,
    decimal Subtotal,
    decimal Iva,
    decimal Total,
    decimal Deuda,
    bool Pagado,
    string? Observaciones,
    int? LocalId,
    string? LocalNombre,
    int? UsuarioId,
    DateTime FechaCreacion,
    bool Activo);

public record CrearGastoDto(
    string Nombre,
    DateTime FechaGasto,
    DateTime? FechaVencimiento,
    string? Categoria,
    string? Proveedor,
    string? Etiqueta,
    int? FormaPagoId,
    decimal Subtotal,
    decimal Iva,
    decimal Total,
    decimal Deuda,
    bool Pagado,
    string? Observaciones,
    int? LocalId);

public record ActualizarGastoDto(
    string Nombre,
    DateTime FechaGasto,
    DateTime? FechaVencimiento,
    string? Categoria,
    string? Proveedor,
    string? Etiqueta,
    int? FormaPagoId,
    decimal Subtotal,
    decimal Iva,
    decimal Total,
    decimal Deuda,
    bool Pagado,
    string? Observaciones,
    int? LocalId);

public record GastoStatsDto(
    int CantidadGastos,
    int GastosPagados,
    int GastosAdeudados,
    decimal GastosTotal);
