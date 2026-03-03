using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IComboService
{
    Task<IEnumerable<ComboDto>> GetAllAsync();
    Task<IEnumerable<ComboDto>> GetActivosAsync();
    Task<ComboDto?> GetByIdAsync(int id);
    Task<ComboDto> CreateAsync(CrearComboDto dto);
    Task<ComboDto?> UpdateAsync(int id, ActualizarComboDto dto);
    Task<bool> DeleteAsync(int id);
}
