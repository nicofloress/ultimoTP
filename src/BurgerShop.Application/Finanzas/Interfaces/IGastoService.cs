using BurgerShop.Application.Finanzas.DTOs;

namespace BurgerShop.Application.Finanzas.Interfaces;

public interface IGastoService
{
    Task<IEnumerable<GastoDto>> GetAllAsync(int? localId = null);
    Task<GastoDto?> GetByIdAsync(int id);
    Task<GastoStatsDto> GetStatsAsync(int? localId = null);
    Task<GastoDto> CreateAsync(CrearGastoDto dto, int? usuarioId = null);
    Task<GastoDto?> UpdateAsync(int id, ActualizarGastoDto dto);
    Task<bool> DeleteAsync(int id);
}
