using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IMarcaService
{
    Task<IEnumerable<MarcaDto>> GetAllAsync();
    Task<IEnumerable<MarcaDto>> GetActivasAsync();
    Task<MarcaDto> CreateAsync(CrearMarcaDto dto);
    Task<MarcaDto?> UpdateAsync(int id, ActualizarMarcaDto dto);
    Task<bool> DeleteAsync(int id);
}
