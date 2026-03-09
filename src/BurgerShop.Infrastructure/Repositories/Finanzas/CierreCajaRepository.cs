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

    public async Task<CierreCaja?> GetCajaAbiertaAsync()
    {
        return await _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Pedidos)
            .FirstOrDefaultAsync(c => c.Estado == EstadoCaja.Abierta);
    }

    public async Task<CierreCaja?> GetByIdConDetallesAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .Include(c => c.Pedidos)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<CierreCaja>> GetHistorialAsync(int cantidad = 20)
    {
        return await _dbSet
            .Include(c => c.Detalles).ThenInclude(d => d.FormaPago)
            .OrderByDescending(c => c.FechaApertura)
            .Take(cantidad)
            .ToListAsync();
    }
}
