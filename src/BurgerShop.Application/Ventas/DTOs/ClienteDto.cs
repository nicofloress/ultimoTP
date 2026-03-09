namespace BurgerShop.Application.Ventas.DTOs;

public record ClienteDto(
    int Id,
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    string? ZonaNombre,
    int? TipoClienteId,
    string? TipoClienteNombre);

public record CrearClienteDto(
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId);

public record ActualizarClienteDto(
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId);
