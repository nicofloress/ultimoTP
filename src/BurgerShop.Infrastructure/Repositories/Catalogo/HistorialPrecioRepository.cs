using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class HistorialPrecioRepository : Repository<HistorialPrecio>, IHistorialPrecioRepository
{
    public HistorialPrecioRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<HistorialPrecio>> GetByEntidadAsync(string tipoEntidad, int entidadId)
    {
        return await _dbSet
            .Where(h => h.TipoEntidad == tipoEntidad && h.EntidadId == entidadId)
            .OrderByDescending(h => h.FechaCambio)
            .ToListAsync();
    }

    public async Task<IEnumerable<HistorialPrecio>> GetRecientesAsync(int cantidad = 50)
    {
        return await _dbSet
            .OrderByDescending(h => h.FechaCambio)
            .Take(cantidad)
            .ToListAsync();
    }
}
