namespace BurgerShop.Application.Ventas.DTOs;

public record ClienteDto(
    int Id,
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    string? ZonaNombre,
    int? TipoClienteId,
    string? TipoClienteNombre,
    int? ListaPrecioId,
    string? ListaPrecioNombre);

public record CrearClienteDto(
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId,
    int? ListaPrecioId);

public record ActualizarClienteDto(
    string Nombre,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId,
    int? ListaPrecioId);
