using BurgerShop.Application.Inventario.DTOs;

namespace BurgerShop.Application.Inventario.Interfaces;

public interface ILocalService
{
    Task<LocalDto> CreateAsync(CrearLocalDto dto);
    Task<LocalDto> UpdateAsync(int id, ActualizarLocalDto dto);
    Task<LocalDto?> GetByIdAsync(int id);
    Task<IEnumerable<LocalDto>> GetAllAsync();
    Task DeleteAsync(int id);
}
