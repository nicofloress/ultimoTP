namespace BurgerShop.Application.Inventario.DTOs;

public record LocalDto(int Id, string Nombre, string? Direccion, int? EmpresaId, string? EmpresaNombre, bool EsPuntoVenta, bool Activo);

public record CrearLocalDto(string Nombre, string? Direccion, int? EmpresaId, bool EsPuntoVenta);

public record ActualizarLocalDto(string Nombre, string? Direccion, int? EmpresaId, bool EsPuntoVenta, bool Activo);
