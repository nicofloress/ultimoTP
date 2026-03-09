using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(IUsuarioRepository usuarioRepo, IJwtTokenGenerator tokenGenerator)
    {
        _usuarioRepo = usuarioRepo;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResultDto?> LoginAsync(LoginDto dto)
    {
        var usuario = await _usuarioRepo.GetByNombreUsuarioAsync(dto.NombreUsuario);

        if (usuario is null || !usuario.Activo) return null;
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash)) return null;

        var rolNombre = usuario.Rol.ToString();
        var token = _tokenGenerator.GenerateToken(usuario.Id, usuario.NombreCompleto, rolNombre, usuario.RepartidorId);

        return new LoginResultDto
        {
            Token = token,
            Usuario = MapToDto(usuario, rolNombre)
        };
    }

    public async Task<UsuarioDto?> GetUsuarioByIdAsync(int id)
    {
        var usuario = await _usuarioRepo.GetByIdActivoAsync(id);
        if (usuario is null) return null;
        return MapToDto(usuario, usuario.Rol.ToString());
    }

    private static UsuarioDto MapToDto(Usuario usuario, string rolNombre) =>
        new UsuarioDto
        {
            Id = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            NombreCompleto = usuario.NombreCompleto,
            Rol = usuario.Rol,
            RolNombre = rolNombre,
            RepartidorId = usuario.RepartidorId
        };
}
