using BurgerShop.Application.Auth.DTOs;

namespace BurgerShop.Application.Auth.Interfaces;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioListDto>> GetAllAsync();
    Task<UsuarioListDto?> GetByIdAsync(int id);
    Task<UsuarioListDto> CreateAsync(CrearUsuarioDto dto);
    Task<UsuarioListDto?> UpdateAsync(int id, ActualizarUsuarioDto dto);
    Task<bool> DesactivarAsync(int id);
}
