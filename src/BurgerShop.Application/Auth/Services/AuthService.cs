using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUsuarioRepository usuarioRepo, IJwtTokenGenerator tokenGenerator, ILogger<AuthService> logger)
    {
        _usuarioRepo = usuarioRepo;
        _tokenGenerator = tokenGenerator;
        _logger = logger;
    }

    public async Task<LoginResultDto?> LoginAsync(LoginDto dto)
    {
        try
        {
            var usuario = await _usuarioRepo.GetByNombreUsuarioAsync(dto.NombreUsuario);

            if (usuario is null || !usuario.Activo) return null;
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash)) return null;

            var rolNombre = usuario.Rol.ToString();
            var token = _tokenGenerator.GenerateToken(usuario.Id, usuario.NombreCompleto, rolNombre, usuario.RepartidorId, usuario.LocalId);

            return new LoginResultDto
            {
                Token = token,
                Usuario = MapToDto(usuario, rolNombre)
            };
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(LoginAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(LoginAsync), ex.Message);
            throw;
        }
    }

    public async Task<UsuarioDto?> GetUsuarioByIdAsync(int id)
    {
        try
        {
            var usuario = await _usuarioRepo.GetByIdActivoAsync(id);
            if (usuario is null) return null;
            return MapToDto(usuario, usuario.Rol.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetUsuarioByIdAsync), ex.Message);
            throw;
        }
    }

    private static UsuarioDto MapToDto(Usuario usuario, string rolNombre) =>
        new UsuarioDto
        {
            Id = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            NombreCompleto = usuario.NombreCompleto,
            Rol = usuario.Rol,
            RolNombre = rolNombre,
            RepartidorId = usuario.RepartidorId,
            LocalId = usuario.LocalId
        };
}
