using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.DTOs;

public record ClienteDto(
    int Id,
    string Nombre,
    string? Cuit,
    string? Email,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    string? ZonaNombre,
    int? TipoClienteId,
    string? TipoClienteNombre,
    int? ListaPrecioId,
    string? ListaPrecioNombre,
    int? LocalId,
    string? LocalNombre,
    CondicionFiscal CondicionFiscal = CondicionFiscal.ConsumidorFinal);

public record CrearClienteDto(
    string Nombre,
    string? Cuit,
    string? Email,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId,
    int? ListaPrecioId,
    int? LocalId,
    CondicionFiscal CondicionFiscal = CondicionFiscal.ConsumidorFinal);

public record ActualizarClienteDto(
    string Nombre,
    string? Cuit,
    string? Email,
    string? Telefono,
    string? Direccion,
    int? ZonaId,
    int? TipoClienteId,
    int? ListaPrecioId,
    int? LocalId,
    CondicionFiscal CondicionFiscal = CondicionFiscal.ConsumidorFinal);
