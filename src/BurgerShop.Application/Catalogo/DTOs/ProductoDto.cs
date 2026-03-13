namespace BurgerShop.Application.Catalogo.DTOs;

public record ProductoDto(
    int Id, string Nombre, string? Descripcion, decimal Precio,
    int CategoriaId, string CategoriaNombre, bool Activo, string? ImagenUrl, string? NumeroInterno,
    int? PesoGramos = null, int UnidadesPorBulto = 1, decimal? PrecioLista = null,
    string? Marca = null, int UnidadesPorMedia = 0);

public record CrearProductoDto(string Nombre, string? Descripcion, decimal Precio, int CategoriaId, string? ImagenUrl, string? NumeroInterno, int? PesoGramos = null, int UnidadesPorBulto = 1, string? Marca = null, int UnidadesPorMedia = 0);
public record ActualizarProductoDto(string Nombre, string? Descripcion, decimal Precio, int CategoriaId, bool Activo, string? ImagenUrl, string? NumeroInterno, int? PesoGramos = null, int UnidadesPorBulto = 1, string? Marca = null, int UnidadesPorMedia = 0);
