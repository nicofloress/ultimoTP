using BurgerShop.Application.Logistica.DTOs;

namespace BurgerShop.Application.Logistica.Interfaces;

public interface IZonaService
{
    Task<IEnumerable<ZonaDto>> GetAllAsync();
    Task<ZonaDto?> GetByIdAsync(int id);
    Task<ZonaDto> CreateAsync(CrearZonaDto dto);
    Task<ZonaDto?> UpdateAsync(int id, ActualizarZonaDto dto);
    Task<bool> DeleteAsync(int id);
}
