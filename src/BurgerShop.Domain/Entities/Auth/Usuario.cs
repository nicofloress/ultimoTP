using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Auth;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public int? RepartidorId { get; set; }
    public bool Activo { get; set; } = true;

    public Repartidor? Repartidor { get; set; }
}
