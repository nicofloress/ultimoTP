namespace BurgerShop.Application.Logistica.DTOs;

public record ZonaDto(int Id, string Nombre, string? Descripcion, decimal CostoEnvio, bool Activa);
public record CrearZonaDto(string Nombre, string? Descripcion, decimal CostoEnvio);
public record ActualizarZonaDto(string Nombre, string? Descripcion, decimal CostoEnvio, bool Activa);
