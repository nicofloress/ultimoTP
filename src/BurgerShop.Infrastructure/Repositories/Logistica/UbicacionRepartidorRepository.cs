using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Logistica;

public class UbicacionRepartidorRepository : Repository<UbicacionRepartidor>, IUbicacionRepartidorRepository
{
    public UbicacionRepartidorRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<UbicacionRepartidor?> GetByRepartidorIdAsync(int repartidorId)
    {
        return await _dbSet.Include(u => u.Repartidor).FirstOrDefaultAsync(u => u.RepartidorId == repartidorId);
    }

    public async Task<IEnumerable<UbicacionRepartidor>> GetActivosAsync()
    {
        return await _dbSet
            .Include(u => u.Repartidor)
            .Where(u => u.EstaActivo)
            .OrderByDescending(u => u.FechaActualizacion)
            .ToListAsync();
    }

    public async Task<UbicacionRepartidor> AddOrUpdateAsync(int repartidorId, double latitud, double longitud)
    {
        var existente = await _dbSet.FirstOrDefaultAsync(u => u.RepartidorId == repartidorId);

        if (existente is not null)
        {
            existente.Latitud = latitud;
            existente.Longitud = longitud;
            existente.FechaActualizacion = DateTime.UtcNow;
            existente.EstaActivo = true;
        }
        else
        {
            existente = new UbicacionRepartidor
            {
                RepartidorId = repartidorId,
                Latitud = latitud,
                Longitud = longitud,
                FechaActualizacion = DateTime.UtcNow,
                EstaActivo = true
            };
            await _dbSet.AddAsync(existente);
        }

        await _context.SaveChangesAsync();
        await _context.Entry(existente).Reference(u => u.Repartidor).LoadAsync();
        return existente;
    }

    public async Task DesactivarAsync(int repartidorId)
    {
        var ubicacion = await _dbSet.FirstOrDefaultAsync(u => u.RepartidorId == repartidorId);
        if (ubicacion is not null)
        {
            ubicacion.EstaActivo = false;
            await _context.SaveChangesAsync();
        }
    }
}
