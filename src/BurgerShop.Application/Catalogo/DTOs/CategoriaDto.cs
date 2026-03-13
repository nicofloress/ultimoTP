namespace BurgerShop.Application.Catalogo.DTOs;

public record CategoriaDto(int Id, string Nombre, bool Activa, int? CategoriaPadreId = null, string? CategoriaPadreNombre = null);
public record CrearCategoriaDto(string Nombre, int? CategoriaPadreId = null);
public record ActualizarCategoriaDto(string Nombre, bool Activa, int? CategoriaPadreId = null);
