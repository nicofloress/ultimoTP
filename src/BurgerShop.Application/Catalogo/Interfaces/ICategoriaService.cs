using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface ICategoriaService
{
    Task<IEnumerable<CategoriaDto>> GetAllAsync();
    Task<CategoriaDto?> GetByIdAsync(int id);
    Task<CategoriaDto> CreateAsync(CrearCategoriaDto dto);
    Task<CategoriaDto?> UpdateAsync(int id, ActualizarCategoriaDto dto);
    Task<bool> DeleteAsync(int id);
}
