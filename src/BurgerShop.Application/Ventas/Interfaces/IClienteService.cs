using BurgerShop.Application.Ventas.DTOs;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface IClienteService
{
    Task<IEnumerable<ClienteDto>> GetAllAsync();
    Task<ClienteDto?> GetByIdAsync(int id);
    Task<IEnumerable<ClienteDto>> BuscarAsync(string term);
    Task<ClienteDto> CreateAsync(CrearClienteDto dto);
    Task<ClienteDto?> UpdateAsync(int id, ActualizarClienteDto dto);
    Task<bool> DeleteAsync(int id);
}
