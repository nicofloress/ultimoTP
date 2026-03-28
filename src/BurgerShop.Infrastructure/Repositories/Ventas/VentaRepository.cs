using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces.Ventas;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Ventas;

public class VentaRepository : Repository<Venta>, IVentaRepository
{
    public VentaRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Venta?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(v => v.Detalles).ThenInclude(d => d.Producto)
            .Include(v => v.Detalles).ThenInclude(d => d.Combo)
            .Include(v => v.Pagos).ThenInclude(p => p.FormaPago)
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .Include(v => v.Pedido)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<IEnumerable<Venta>> GetByFechaAsync(DateTime fecha)
    {
        return await _dbSet
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .Where(v => v.Fecha.Date == fecha.Date)
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByRangoFechasAsync(DateTime desde, DateTime hasta)
    {
        return await _dbSet
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .Where(v => v.Fecha.Date >= desde.Date && v.Fecha.Date <= hasta.Date)
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByLocalAsync(int localId, DateTime? desde = null, DateTime? hasta = null)
    {
        var query = _dbSet
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .Where(v => v.LocalId == localId);

        if (desde.HasValue)
            query = query.Where(v => v.Fecha.Date >= desde.Value.Date);

        if (hasta.HasValue)
            query = query.Where(v => v.Fecha.Date <= hasta.Value.Date);

        return await query
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();
    }

    public async Task<int> GetSiguienteNumeroVentaAsync(DateTime fecha)
    {
        var count = await _dbSet
            .Where(v => v.Fecha.Date == fecha.Date)
            .CountAsync();
        return count + 1;
    }

    public async Task<Venta?> GetByPedidoIdAsync(int pedidoId)
    {
        return await _dbSet
            .Include(v => v.Detalles).ThenInclude(d => d.Producto)
            .Include(v => v.Detalles).ThenInclude(d => d.Combo)
            .Include(v => v.Pagos).ThenInclude(p => p.FormaPago)
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .FirstOrDefaultAsync(v => v.PedidoId == pedidoId);
    }
}
