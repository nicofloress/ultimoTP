using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Infrastructure.Data;
using BurgerShop.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Finanzas;

public class GastoRepository : Repository<Gasto>, IGastoRepository
{
    public GastoRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Gasto>> GetAllConDetallesAsync()
    {
        return await _dbSet
            .Include(g => g.FormaPago)
            .Include(g => g.Local)
            .Where(g => g.Activo)
            .OrderByDescending(g => g.FechaGasto)
            .ToListAsync();
    }

    public async Task<IEnumerable<Gasto>> GetByLocalAsync(int localId)
    {
        return await _dbSet
            .Include(g => g.FormaPago)
            .Include(g => g.Local)
            .Where(g => g.LocalId == localId && g.Activo)
            .OrderByDescending(g => g.FechaGasto)
            .ToListAsync();
    }

    public async Task<Gasto?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(g => g.FormaPago)
            .Include(g => g.Local)
            .FirstOrDefaultAsync(g => g.Id == id);
    }
}
