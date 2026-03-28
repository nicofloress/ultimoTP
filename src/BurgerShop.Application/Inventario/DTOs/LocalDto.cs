namespace BurgerShop.Application.Inventario.DTOs;

public record LocalDto(int Id, string Nombre, string? Direccion, bool EsPuntoVenta, bool Activo);

public record CrearLocalDto(string Nombre, string? Direccion, bool EsPuntoVenta);

public record ActualizarLocalDto(string Nombre, string? Direccion, bool EsPuntoVenta, bool Activo);
