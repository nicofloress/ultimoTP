using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IProveedorService
{
    Task<IEnumerable<ProveedorDto>> GetAllAsync();
    Task<ProveedorDto?> GetByIdAsync(int id);
    Task<ProveedorDto> CreateAsync(CrearProveedorDto dto);
    Task<ProveedorDto?> UpdateAsync(int id, ActualizarProveedorDto dto);
    Task<bool> DeleteAsync(int id);
}
