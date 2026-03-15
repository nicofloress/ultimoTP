using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Auth;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly BurgerShopDbContext _context;

    public UsuarioRepository(BurgerShopDbContext context) => _context = context;

    public async Task<Usuario?> GetByNombreUsuarioAsync(string nombreUsuario)
        => await _context.Usuarios
            .Include(u => u.Repartidor)
            .FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);

    public async Task<Usuario?> GetByIdActivoAsync(int id)
        => await _context.Usuarios
            .Include(u => u.Repartidor)
            .FirstOrDefaultAsync(u => u.Id == id && u.Activo);

    public async Task<IEnumerable<Usuario>> GetAllAsync()
        => await _context.Usuarios
            .Include(u => u.Repartidor)
            .OrderBy(u => u.Id)
            .ToListAsync();

    public async Task<Usuario?> GetByIdAsync(int id)
        => await _context.Usuarios
            .Include(u => u.Repartidor)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task<Usuario> AddAsync(Usuario usuario)
    {
        await _context.Usuarios.AddAsync(usuario);
        return usuario;
    }

    public void Update(Usuario usuario)
        => _context.Usuarios.Update(usuario);

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();
}
