namespace BurgerShop.Application.Logistica.DTOs;

public record RepartidorDto(int Id, string Nombre, string? Telefono, string? Vehiculo, bool Activo, List<ZonaDto> Zonas, int? LocalId, string? LocalNombre);
public record CrearRepartidorDto(string Nombre, string? Telefono = null, string? Vehiculo = null, int? LocalId = null);
public record ActualizarRepartidorDto(string Nombre, string? Telefono, string? Vehiculo, bool Activo, int? LocalId = null);
public record LoginRepartidorDto(string CodigoAcceso);
public record RepartidorLoginResultDto(int Id, string Nombre);
public record AsignarZonasDto(List<int> ZonaIds);
