namespace BurgerShop.Application.Catalogo.DTOs;

public record ProductoDto(
    int Id, string Nombre, string? Descripcion, decimal Precio,
    int CategoriaId, string CategoriaNombre, bool Activo, string? ImagenUrl);

public record CrearProductoDto(string Nombre, string? Descripcion, decimal Precio, int CategoriaId, string? ImagenUrl);
public record ActualizarProductoDto(string Nombre, string? Descripcion, decimal Precio, int CategoriaId, bool Activo, string? ImagenUrl);
