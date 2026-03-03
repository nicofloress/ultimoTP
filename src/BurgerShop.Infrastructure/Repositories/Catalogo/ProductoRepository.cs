using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class ProductoRepository : Repository<Producto>, IProductoRepository
{
    public ProductoRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Producto>> GetByCategoriaAsync(int categoriaId)
    {
        return await _dbSet
            .Include(p => p.Categoria)
            .Where(p => p.CategoriaId == categoriaId && p.Activo)
            .ToListAsync();
    }

    public async Task<IEnumerable<Producto>> GetActivosAsync()
    {
        return await _dbSet
            .Include(p => p.Categoria)
            .Where(p => p.Activo)
            .OrderBy(p => p.Categoria.Nombre)
            .ThenBy(p => p.Nombre)
            .ToListAsync();
    }
}
