using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Infrastructure.Data;
using BurgerShop.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Finanzas;

public class CierreCajaRepository : Repository<CierreCaja>, ICierreCajaRepository
{
    public CierreCajaRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<CierreCaja?> GetCajaAbiertaAsync(int? localId = null)
    {
        var query = _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Local)
            .Include(c => c.Ventas)
            .Where(c => c.Estado == EstadoCaja.Abierta);

        if (localId.HasValue)
            query = query.Where(c => c.LocalId == localId.Value);

        return await query.FirstOrDefaultAsync();
    }

    public async Task<CierreCaja?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Local)
            .Include(c => c.Ventas)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<CierreCaja>> GetHistorialAsync(int cantidad = 50, int? localId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        var query = _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Local)
            .AsQueryable();

        if (localId.HasValue)
            query = query.Where(c => c.LocalId == localId.Value);

        if (fechaDesde.HasValue)
            query = query.Where(c => c.FechaApertura >= fechaDesde.Value);

        if (fechaHasta.HasValue)
            query = query.Where(c => c.FechaApertura < fechaHasta.Value.Date.AddDays(1));

        return await query
            .OrderByDescending(c => c.FechaApertura)
            .Take(cantidad)
            .ToListAsync();
    }

    public async Task<IEnumerable<CierreCaja>> GetPendientesRevisionAsync(int? localId = null)
    {
        var query = _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Local)
            .Where(c => c.Estado == EstadoCaja.PendienteRevision);

        if (localId.HasValue)
            query = query.Where(c => c.LocalId == localId.Value);

        return await query
            .OrderByDescending(c => c.FechaCierre)
            .ToListAsync();
    }
}
