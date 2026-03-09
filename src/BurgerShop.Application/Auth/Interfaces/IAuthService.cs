using BurgerShop.Application.Auth.DTOs;

namespace BurgerShop.Application.Auth.Interfaces;

public interface IAuthService
{
    Task<LoginResultDto?> LoginAsync(LoginDto dto);
    Task<UsuarioDto?> GetUsuarioByIdAsync(int id);
}
