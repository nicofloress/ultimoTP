using BurgerShop.Domain.Entities.Auth;

namespace BurgerShop.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByNombreUsuarioAsync(string nombreUsuario);
    Task<Usuario?> GetByIdActivoAsync(int id);
    Task<IEnumerable<Usuario>> GetAllAsync();
    Task<Usuario?> GetByIdAsync(int id);
    Task<Usuario> AddAsync(Usuario usuario);
    void Update(Usuario usuario);
    Task<int> SaveChangesAsync();
}
