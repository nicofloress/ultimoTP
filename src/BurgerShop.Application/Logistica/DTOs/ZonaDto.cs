namespace BurgerShop.Application.Logistica.DTOs;

public record ZonaDto(int Id, string Nombre, string? Descripcion, decimal CostoEnvio, bool Activa, int? LocalId = null, string? LocalNombre = null);
public record CrearZonaDto(string Nombre, string? Descripcion, decimal CostoEnvio, int? LocalId = null);
public record ActualizarZonaDto(string Nombre, string? Descripcion, decimal CostoEnvio, bool Activa, int? LocalId = null);
