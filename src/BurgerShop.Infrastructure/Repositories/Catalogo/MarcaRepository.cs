using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class MarcaRepository : Repository<Marca>, IMarcaRepository
{
    public MarcaRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Marca>> GetAllConProveedorAsync()
    {
        return await _dbSet
            .IgnoreQueryFilters()
            .Include(m => m.Proveedor)
            .OrderBy(m => m.Nombre)
            .ToListAsync();
    }

    public async Task<IEnumerable<Marca>> GetActivasConProveedorAsync()
    {
        return await _dbSet
            .Include(m => m.Proveedor)
            .Where(m => m.Activo)
            .OrderBy(m => m.Nombre)
            .ToListAsync();
    }

    public async Task<Marca?> GetByIdConProveedorAsync(int id)
    {
        return await _dbSet
            .IgnoreQueryFilters()
            .Include(m => m.Proveedor)
            .FirstOrDefaultAsync(m => m.Id == id);
    }
}
