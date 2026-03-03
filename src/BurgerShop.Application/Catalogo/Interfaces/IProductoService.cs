using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IProductoService
{
    Task<IEnumerable<ProductoDto>> GetAllAsync();
    Task<IEnumerable<ProductoDto>> GetActivosAsync();
    Task<IEnumerable<ProductoDto>> GetByCategoriaAsync(int categoriaId);
    Task<ProductoDto?> GetByIdAsync(int id);
    Task<ProductoDto> CreateAsync(CrearProductoDto dto);
    Task<ProductoDto?> UpdateAsync(int id, ActualizarProductoDto dto);
    Task<bool> DeleteAsync(int id);
}
