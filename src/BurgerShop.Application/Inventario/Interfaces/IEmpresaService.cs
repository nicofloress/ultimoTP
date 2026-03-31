using BurgerShop.Application.Inventario.DTOs;

namespace BurgerShop.Application.Inventario.Interfaces;

public interface IEmpresaService
{
    Task<IEnumerable<EmpresaDto>> GetAllAsync();
    Task<EmpresaDto?> GetByIdAsync(int id);
    Task<EmpresaDto> CreateAsync(CrearEmpresaDto dto);
    Task<EmpresaDto?> UpdateAsync(int id, ActualizarEmpresaDto dto);
    Task<bool> DeleteAsync(int id);
}
