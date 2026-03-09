using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Catalogo;

public class ListaPrecioRepository : Repository<ListaPrecio>, IListaPrecioRepository
{
    public ListaPrecioRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<ListaPrecio?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(l => l.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IEnumerable<ListaPrecio>> GetAllConDetallesAsync()
    {
        return await _dbSet
            .Include(l => l.Detalles)
                .ThenInclude(d => d.Producto)
            .OrderBy(l => l.Nombre)
            .ToListAsync();
    }

    public async Task<ListaPrecioDetalle?> GetDetalleAsync(int listaPrecioId, int productoId)
    {
        return await _context.Set<ListaPrecioDetalle>()
            .FirstOrDefaultAsync(d => d.ListaPrecioId == listaPrecioId && d.ProductoId == productoId);
    }

    public async Task<decimal?> GetPrecioProductoAsync(int listaPrecioId, int productoId)
    {
        var detalle = await _context.Set<ListaPrecioDetalle>()
            .Where(d => d.ListaPrecioId == listaPrecioId && d.ProductoId == productoId)
            .Select(d => (decimal?)d.Precio)
            .FirstOrDefaultAsync();
        return detalle;
    }

    public async Task DesactivarOtrasDefaultAsync(int exceptoId)
    {
        var otrasDefault = await _dbSet
            .Where(l => l.EsDefault && l.Id != exceptoId)
            .ToListAsync();

        foreach (var lista in otrasDefault)
        {
            lista.EsDefault = false;
        }
    }

    public async Task AddDetalleAsync(ListaPrecioDetalle detalle)
    {
        await _context.Set<ListaPrecioDetalle>().AddAsync(detalle);
    }

    public void RemoveDetalle(ListaPrecioDetalle detalle)
    {
        _context.Set<ListaPrecioDetalle>().Remove(detalle);
    }
}
