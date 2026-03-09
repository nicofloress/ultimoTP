using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IProductoService
{
    Task<IEnumerable<ProductoDto>> GetAllAsync();
    Task<IEnumerable<ProductoDto>> GetActivosAsync(int? listaPrecioId = null);
    Task<IEnumerable<ProductoDto>> GetByCategoriaAsync(int categoriaId, int? listaPrecioId = null);
    Task<ProductoDto?> GetByIdAsync(int id);
    Task<ProductoDto> CreateAsync(CrearProductoDto dto);
    Task<ProductoDto?> UpdateAsync(int id, ActualizarProductoDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<ProductoDto>> BuscarAsync(string termino, int? listaPrecioId = null);
}
