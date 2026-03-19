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
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Cliente)
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Zona)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<RendicionRepartidor>> GetByRepartidorAsync(int repartidorId)
    {
        return await _dbSet
            .Include(r => r.Repartidor)
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Cliente)
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Zona)
            .Where(r => r.RepartidorId == repartidorId)
            .OrderByDescending(r => r.Fecha)
            .ToListAsync();
    }

    public async Task<IEnumerable<RendicionRepartidor>> GetAllConRepartidorAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        var query = _dbSet
            .Include(r => r.Repartidor)
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Cliente)
            .Include(r => r.Detalles).ThenInclude(d => d.Pedido).ThenInclude(p => p.Zona)
            .AsQueryable();

        if (fechaDesde.HasValue)
            query = query.Where(r => r.Fecha.Date >= fechaDesde.Value.Date);

        if (fechaHasta.HasValue)
            query = query.Where(r => r.Fecha.Date <= fechaHasta.Value.Date);

        return await query
            .OrderByDescending(r => r.Fecha)
            .ToListAsync();
    }

    public async Task<RendicionRepartidor?> GetByRepartidorFechaAsync(int repartidorId, DateTime fecha)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.RepartidorId == repartidorId && r.Fecha.Date == fecha.Date);
    }

    public async Task<RendicionRepartidor?> GetByRepartoZonaIdAsync(int repartoZonaId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.RepartoZonaId == repartoZonaId);
    }
}
