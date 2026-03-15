using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Auth.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _repo;

    public UsuarioService(IUsuarioRepository repo) => _repo = repo;

    public async Task<IEnumerable<UsuarioListDto>> GetAllAsync()
    {
        var usuarios = await _repo.GetAllAsync();
        return usuarios.Select(ToDto);
    }

    public async Task<UsuarioListDto?> GetByIdAsync(int id)
    {
        var usuario = await _repo.GetByIdAsync(id);
        return usuario is null ? null : ToDto(usuario);
    }

    public async Task<UsuarioListDto> CreateAsync(CrearUsuarioDto dto)
    {
        var usuario = new Usuario
        {
            NombreUsuario = dto.NombreUsuario,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            NombreCompleto = dto.NombreCompleto,
            Rol = dto.Rol,
            RepartidorId = dto.RepartidorId,
            Activo = true
        };
        await _repo.AddAsync(usuario);
        await _repo.SaveChangesAsync();
        return ToDto(usuario);
    }

    public async Task<UsuarioListDto?> UpdateAsync(int id, ActualizarUsuarioDto dto)
    {
        var usuario = await _repo.GetByIdAsync(id);
        if (usuario is null) return null;

        usuario.NombreUsuario = dto.NombreUsuario;
        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Rol = dto.Rol;
        usuario.RepartidorId = dto.RepartidorId;
        usuario.Activo = dto.Activo;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        _repo.Update(usuario);
        await _repo.SaveChangesAsync();
        return ToDto(usuario);
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var usuario = await _repo.GetByIdAsync(id);
        if (usuario is null) return false;

        usuario.Activo = false;
        _repo.Update(usuario);
        await _repo.SaveChangesAsync();
        return true;
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
        Activo = u.Activo
    };
}
