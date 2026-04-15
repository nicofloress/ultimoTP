using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Inventario;

/// <summary>
/// Repositorio de ArtiStock. No extiende Repository&lt;T&gt; porque la PK es compuesta (ProductoId + LocalId).
/// </summary>
public class ArtiStockRepository : IArtiStockRepository
{
    private readonly BurgerShopDbContext _context;

    public ArtiStockRepository(BurgerShopDbContext context)
    {
        _context = context;
    }

    public async Task<ArtiStock?> GetByProductoLocalAsync(int productoId, int localId)
    {
        return await _context.ArtiStock.FindAsync(productoId, localId);
    }

    public async Task<IEnumerable<ArtiStock>> GetByLocalAsync(int localId)
    {
        return await _context.ArtiStock
            .Include(a => a.Producto)
            .Include(a => a.Local)
            .Where(a => a.LocalId == localId)
            .OrderBy(a => a.Producto.Nombre)
            .ToListAsync();
    }

    public async Task<IEnumerable<ArtiStock>> GetStockBajoAsync(int localId)
    {
        return await _context.ArtiStock
            .Include(a => a.Producto)
            .Include(a => a.Local)
            .Where(a => a.LocalId == localId
                     && (a.StockFinal <= 0
                         || (a.StockMinimo != null && a.StockFinal <= a.StockMinimo)))
            .OrderBy(a => a.Producto.Nombre)
            .ToListAsync();
    }

    public async Task AddOrUpdateAsync(ArtiStock artiStock)
    {
        var existente = await _context.ArtiStock
            .FindAsync(artiStock.ProductoId, artiStock.LocalId);

        if (existente is null)
        {
            await _context.ArtiStock.AddAsync(artiStock);
        }
        else
        {
            // Copiar valores al objeto ya trackeado por EF
            existente.IngresoLocal       = artiStock.IngresoLocal;
            existente.EgresoLocal        = artiStock.EgresoLocal;
            existente.VentaLocal         = artiStock.VentaLocal;
            existente.StockFinal         = artiStock.StockFinal;
            existente.StockMinimo        = artiStock.StockMinimo;
            existente.UltimaModificacion = artiStock.UltimaModificacion;
        }
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
