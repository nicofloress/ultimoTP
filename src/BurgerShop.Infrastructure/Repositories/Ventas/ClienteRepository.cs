using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces.Ventas;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Ventas;

public class ClienteRepository : Repository<Cliente>, IClienteRepository
{
    public ClienteRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Cliente>> GetAllWithNavigationsAsync()
    {
        return await _dbSet
            .Include(c => c.Zona)
            .Include(c => c.TipoCliente)
            .Include(c => c.ListaPrecio)
            .Include(c => c.Local)
            .OrderBy(c => c.Nombre)
            .ToListAsync();
    }

    public async Task<Cliente?> GetByIdWithNavigationsAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Zona)
            .Include(c => c.TipoCliente)
            .Include(c => c.ListaPrecio)
            .Include(c => c.Local)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<Cliente>> BuscarAsync(string term)
    {
        var termLower = term.ToLower();

        return await _dbSet
            .Include(c => c.Zona)
            .Include(c => c.TipoCliente)
            .Include(c => c.ListaPrecio)
            .Include(c => c.Local)
            .Where(c => c.Nombre.ToLower().Contains(termLower)
                     || (c.Telefono != null && c.Telefono.ToLower().Contains(termLower)))
            .OrderBy(c => c.Nombre)
            .ToListAsync();
    }
}
