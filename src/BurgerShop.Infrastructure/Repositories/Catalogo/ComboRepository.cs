using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class ComboRepository : Repository<Combo>, IComboRepository
{
    public ComboRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Combo?> GetByIdWithDetallesAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<Combo>> GetActivosAsync()
    {
        return await _dbSet
            .Include(c => c.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .ToListAsync();
    }
}
