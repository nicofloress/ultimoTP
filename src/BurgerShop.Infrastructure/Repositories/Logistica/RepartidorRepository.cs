using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Logistica;

public class RepartidorRepository : Repository<Repartidor>, IRepartidorRepository
{
    public RepartidorRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Repartidor?> GetByCodigoAccesoAsync(string codigo)
    {
        return await _dbSet.FirstOrDefaultAsync(r => r.CodigoAcceso == codigo && r.Activo);
    }

    public async Task<Repartidor?> GetByIdWithZonasAsync(int id)
    {
        return await _dbSet
            .Include(r => r.RepartidorZonas)
                .ThenInclude(rz => rz.Zona)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Repartidor>> GetActivosAsync()
    {
        return await _dbSet
            .Include(r => r.RepartidorZonas)
                .ThenInclude(rz => rz.Zona)
            .Where(r => r.Activo)
            .OrderBy(r => r.Nombre)
            .ToListAsync();
    }
}
