namespace BurgerShop.Application.Catalogo.DTOs;

public record CategoriaDto(int Id, string Nombre, bool Activa);
public record CrearCategoriaDto(string Nombre);
public record ActualizarCategoriaDto(string Nombre, bool Activa);
