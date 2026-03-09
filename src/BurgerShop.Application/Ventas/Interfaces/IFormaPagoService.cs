using BurgerShop.Application.Ventas.DTOs;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface IFormaPagoService
{
    Task<IEnumerable<FormaPagoDto>> GetAllAsync();
    Task<IEnumerable<FormaPagoDto>> GetActivasAsync();
    Task<FormaPagoDto?> GetByIdAsync(int id);
    Task<FormaPagoDto> CreateAsync(CrearFormaPagoDto dto);
    Task<FormaPagoDto?> UpdateAsync(int id, ActualizarFormaPagoDto dto);
    Task<bool> DeleteAsync(int id);
}
