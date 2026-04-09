using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Infrastructure.Data;
using BurgerShop.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Inventario;

public class MovimientoRepository : Repository<Movimiento>, IMovimientoRepository
{
    public MovimientoRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Movimiento>> GetByLocalAsync(int localId, DateTime? desde = null, DateTime? hasta = null)
    {
        var query = _dbSet
            .Include(m => m.CodigoAccion)
            .Include(m => m.Producto)
            .Include(m => m.Local)
            .Include(m => m.Venta).ThenInclude(v => v!.Cliente)
            .Include(m => m.Usuario)
            .Where(m => m.LocalId == localId);

        if (desde.HasValue)
            query = query.Where(m => m.FechaMovimiento >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(m => m.FechaMovimiento <= hasta.Value);

        return await query
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();
    }

    public async Task<IEnumerable<Movimiento>> GetByProductoLocalAsync(int productoId, int localId, DateTime? desde = null, DateTime? hasta = null)
    {
        var query = _dbSet
            .Include(m => m.CodigoAccion)
            .Include(m => m.Producto)
            .Include(m => m.Local)
            .Include(m => m.Venta).ThenInclude(v => v!.Cliente)
            .Include(m => m.Usuario)
            .Where(m => m.ProductoId == productoId && m.LocalId == localId);

        if (desde.HasValue)
            query = query.Where(m => m.FechaMovimiento >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(m => m.FechaMovimiento <= hasta.Value);

        return await query
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();
    }

    public async Task<IEnumerable<Movimiento>> GetByVentaAsync(int ventaId)
    {
        return await _dbSet
            .Include(m => m.CodigoAccion)
            .Include(m => m.Producto)
            .Include(m => m.Local)
            .Include(m => m.Venta).ThenInclude(v => v!.Cliente)
            .Include(m => m.Usuario)
            .Where(m => m.VentaId == ventaId)
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();
    }
}
