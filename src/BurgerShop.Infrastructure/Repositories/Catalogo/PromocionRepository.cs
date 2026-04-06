using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class PromocionRepository : Repository<Promocion>, IPromocionRepository
{
    public PromocionRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Promocion?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(p => p.Items)
                .ThenInclude(i => i.Producto)
            .Include(p => p.Items)
                .ThenInclude(i => i.Combo)
            .Include(p => p.Locales)
                .ThenInclude(l => l.Local)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Promocion>> GetAllConDetallesAsync()
    {
        return await _dbSet
            .Include(p => p.Items)
                .ThenInclude(i => i.Producto)
            .Include(p => p.Items)
                .ThenInclude(i => i.Combo)
            .Include(p => p.Locales)
                .ThenInclude(l => l.Local)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Promocion>> GetVigentesParaLocalAsync(int localId)
    {
        var hoy = DateTime.Now;
        return await _dbSet
            .Include(p => p.Items)
                .ThenInclude(i => i.Producto)
            .Include(p => p.Items)
                .ThenInclude(i => i.Combo)
            .Include(p => p.Locales)
                .ThenInclude(l => l.Local)
            .Where(p =>
                p.Activa &&
                p.FechaDesde <= hoy &&
                p.FechaHasta >= hoy &&
                p.Locales.Any(l => l.LocalId == localId))
            .OrderBy(p => p.Nombre)
            .ToListAsync();
    }
}
