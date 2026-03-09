using BurgerShop.Domain.Entities.Auth;

namespace BurgerShop.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByNombreUsuarioAsync(string nombreUsuario);
    Task<Usuario?> GetByIdActivoAsync(int id);
}
