namespace BurgerShop.Application.Logistica.DTOs;

public record RepartidorDto(int Id, string Nombre, string? Telefono, string? Vehiculo, bool Activo, List<ZonaDto> Zonas);
public record CrearRepartidorDto(string Nombre, string? Telefono, string? Vehiculo, string CodigoAcceso);
public record ActualizarRepartidorDto(string Nombre, string? Telefono, string? Vehiculo, bool Activo, string? CodigoAcceso);
public record LoginRepartidorDto(string CodigoAcceso);
public record RepartidorLoginResultDto(int Id, string Nombre);
public record AsignarZonasDto(List<int> ZonaIds);
