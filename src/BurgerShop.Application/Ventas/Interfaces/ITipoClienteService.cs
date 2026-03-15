using BurgerShop.Application.Ventas.DTOs;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface ITipoClienteService
{
    Task<IEnumerable<TipoClienteDto>> GetAllAsync();
    Task<TipoClienteDto?> GetByIdAsync(int id);
    Task<TipoClienteDto> CreateAsync(CrearTipoClienteDto dto);
    Task<TipoClienteDto?> UpdateAsync(int id, ActualizarTipoClienteDto dto);
    Task<bool> DeleteAsync(int id);
}
