using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Auth.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _repo;
    private readonly ILogger<UsuarioService> _logger;

    public UsuarioService(IUsuarioRepository repo, ILogger<UsuarioService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<UsuarioListDto>> GetAllAsync()
    {
        try
        {
            var usuarios = await _repo.GetAllAsync();
            return usuarios.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<UsuarioListDto?> GetByIdAsync(int id)
    {
        try
        {
            var usuario = await _repo.GetByIdAsync(id);
            return usuario is null ? null : ToDto(usuario);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<UsuarioListDto> CreateAsync(CrearUsuarioDto dto)
    {
        try
        {
            var usuario = new Usuario
            {
                NombreUsuario = dto.NombreUsuario,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                NombreCompleto = dto.NombreCompleto,
                Rol = dto.Rol,
                RepartidorId = dto.RepartidorId,
                LocalId = dto.LocalId,
                Activo = true
            };
            await _repo.AddAsync(usuario);
            await _repo.SaveChangesAsync();
            return ToDto(usuario);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<UsuarioListDto?> UpdateAsync(int id, ActualizarUsuarioDto dto)
    {
        try
        {
            var usuario = await _repo.GetByIdAsync(id);
            if (usuario is null) return null;

            usuario.NombreUsuario = dto.NombreUsuario;
            usuario.NombreCompleto = dto.NombreCompleto;
            usuario.Rol = dto.Rol;
            usuario.RepartidorId = dto.RepartidorId;
            usuario.LocalId = dto.LocalId;
            usuario.Activo = dto.Activo;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            _repo.Update(usuario);
            await _repo.SaveChangesAsync();
            return ToDto(usuario);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        try
        {
            var usuario = await _repo.GetByIdAsync(id);
            if (usuario is null) return false;

            usuario.Activo = false;
            _repo.Update(usuario);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DesactivarAsync), ex.Message);
            throw;
        }
    }

    private static UsuarioListDto ToDto(Usuario u) => new()
    {
        Id = u.Id,
        NombreUsuario = u.NombreUsuario,
        NombreCompleto = u.NombreCompleto,
        Rol = u.Rol,
        RolNombre = u.Rol.ToString(),
        RepartidorId = u.RepartidorId,
        RepartidorNombre = u.Repartidor?.Nombre,
        LocalId = u.LocalId,
        LocalNombre = u.Local?.Nombre,
        Activo = u.Activo
    };
}
