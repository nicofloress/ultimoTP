using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class ProductoService : IProductoService
{
    private readonly IProductoRepository _repo;

    public ProductoService(IProductoRepository repo) => _repo = repo;

    public async Task<IEnumerable<ProductoDto>> GetAllAsync()
    {
        var productos = await _repo.GetActivosAsync();
        return productos.Select(ToDto);
    }

    public async Task<IEnumerable<ProductoDto>> GetActivosAsync()
    {
        var productos = await _repo.GetActivosAsync();
        return productos.Select(ToDto);
    }

    public async Task<IEnumerable<ProductoDto>> GetByCategoriaAsync(int categoriaId)
    {
        var productos = await _repo.GetByCategoriaAsync(categoriaId);
        return productos.Select(ToDto);
    }

    public async Task<ProductoDto?> GetByIdAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p is null) return null;
        var cat = p.Categoria;
        return new ProductoDto(p.Id, p.Nombre, p.Descripcion, p.Precio, p.CategoriaId, cat?.Nombre ?? "", p.Activo, p.ImagenUrl);
    }

    public async Task<ProductoDto> CreateAsync(CrearProductoDto dto)
    {
        var producto = new Producto
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
            CategoriaId = dto.CategoriaId,
            ImagenUrl = dto.ImagenUrl
        };
        await _repo.AddAsync(producto);
        await _repo.SaveChangesAsync();
        return new ProductoDto(producto.Id, producto.Nombre, producto.Descripcion, producto.Precio, producto.CategoriaId, "", producto.Activo, producto.ImagenUrl);
    }

    public async Task<ProductoDto?> UpdateAsync(int id, ActualizarProductoDto dto)
    {
        var producto = await _repo.GetByIdAsync(id);
        if (producto is null) return null;

        producto.Nombre = dto.Nombre;
        producto.Descripcion = dto.Descripcion;
        producto.Precio = dto.Precio;
        producto.CategoriaId = dto.CategoriaId;
        producto.Activo = dto.Activo;
        producto.ImagenUrl = dto.ImagenUrl;
        _repo.Update(producto);
        await _repo.SaveChangesAsync();
        return new ProductoDto(producto.Id, producto.Nombre, producto.Descripcion, producto.Precio, producto.CategoriaId, "", producto.Activo, producto.ImagenUrl);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var producto = await _repo.GetByIdAsync(id);
        if (producto is null) return false;

        producto.Activo = false;
        _repo.Update(producto);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static ProductoDto ToDto(Producto p)
        => new(p.Id, p.Nombre, p.Descripcion, p.Precio, p.CategoriaId, p.Categoria?.Nombre ?? "", p.Activo, p.ImagenUrl);
}
