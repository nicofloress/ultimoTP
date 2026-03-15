using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Auth.DTOs;

public class UsuarioListDto
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public int? RepartidorId { get; set; }
    public string? RepartidorNombre { get; set; }
    public bool Activo { get; set; }
}

public class CrearUsuarioDto
{
    public string NombreUsuario { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public int? RepartidorId { get; set; }
}

public class ActualizarUsuarioDto
{
    public string NombreUsuario { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public int? RepartidorId { get; set; }
    public bool Activo { get; set; }
}
