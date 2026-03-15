using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Logistica;

public class RendicionRepository : Repository<RendicionRepartidor>, IRendicionRepository
{
    public RendicionRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<RendicionRepartidor?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(r => r.Repartidor)
            .Include(r => r.Detalles)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<RendicionRepartidor>> GetByRepartidorAsync(int repartidorId)
    {
        return await _dbSet
            .Include(r => r.Repartidor)
            .Include(r => r.Detalles)
            .Where(r => r.RepartidorId == repartidorId)
            .OrderByDescending(r => r.Fecha)
            .ToListAsync();
    }

    public async Task<IEnumerable<RendicionRepartidor>> GetAllConRepartidorAsync(DateTime? fecha = null)
    {
        var query = _dbSet
            .Include(r => r.Repartidor)
            .Include(r => r.Detalles)
            .AsQueryable();

        if (fecha.HasValue)
            query = query.Where(r => r.Fecha.Date == fecha.Value.Date);

        return await query
            .OrderByDescending(r => r.Fecha)
            .ToListAsync();
    }

    public async Task<RendicionRepartidor?> GetByRepartidorFechaAsync(int repartidorId, DateTime fecha)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.RepartidorId == repartidorId && r.Fecha.Date == fecha.Date);
    }
}
