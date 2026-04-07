namespace BurgerShop.Application.Catalogo.DTOs;

public record CategoriaDto(int Id, string Nombre, bool Activa, int? CategoriaPadreId = null, string? CategoriaPadreNombre = null, int TipoMegaCategoria = 0);
public record CrearCategoriaDto(string Nombre, int? CategoriaPadreId = null, int? TipoMegaCategoria = null);
public record ActualizarCategoriaDto(string Nombre, bool Activa, int? CategoriaPadreId = null, int? TipoMegaCategoria = null);
