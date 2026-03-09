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
}
