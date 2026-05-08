using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces.Ventas;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Ventas;

/// <summary>
/// Repositorio de CuentaCorriente. Inyecta BurgerShopDbContext directamente
/// porque no hereda Repository&lt;T&gt; (necesita métodos de negocio específicos).
/// </summary>
public class CuentaCorrienteRepository : ICuentaCorrienteRepository
{
    private readonly BurgerShopDbContext _context;

    public CuentaCorrienteRepository(BurgerShopDbContext context)
    {
        _context = context;
    }

    public async Task<CuentaCorriente?> GetByClienteIdAsync(int clienteId)
    {
        return await _context.CuentasCorrientes
            .Include(c => c.Cliente)
            .FirstOrDefaultAsync(c => c.ClienteId == clienteId);
    }

    public async Task<CuentaCorriente?> GetByIdAsync(int id)
    {
        return await _context.CuentasCorrientes.FindAsync(id);
    }

    public async Task<CuentaCorriente?> GetByIdConMovimientosAsync(int id)
    {
        return await _context.CuentasCorrientes
            .Include(c => c.Cliente)
            .Include(c => c.Movimientos.OrderByDescending(m => m.FechaMovimiento))
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<CuentaCorriente>> GetAllActivasAsync()
    {
        return await _context.CuentasCorrientes
            .Include(c => c.Cliente)
            .Where(c => c.Activa)
            .OrderBy(c => c.Cliente.Nombre)
            .ToListAsync();
    }

    public async Task<IEnumerable<CuentaCorriente>> GetConSaldoAsync()
    {
        return await _context.CuentasCorrientes
            .Include(c => c.Cliente)
            .Where(c => c.SaldoActual != 0 && c.Activa)
            .OrderByDescending(c => c.SaldoActual)
            .ToListAsync();
    }

    public async Task<IEnumerable<CuentaCorriente>> GetConSaldoAsync(int? localId)
    {
        var query = _context.CuentasCorrientes
            .Include(c => c.Cliente)
            .Where(c => c.SaldoActual != 0 && c.Activa);
        if (localId.HasValue)
            query = query.Where(c => c.Cliente != null && c.Cliente.LocalId == localId.Value);
        return await query.OrderByDescending(c => c.SaldoActual).ToListAsync();
    }

    public async Task AddAsync(CuentaCorriente cuenta)
    {
        await _context.CuentasCorrientes.AddAsync(cuenta);
    }

    public void Update(CuentaCorriente cuenta)
    {
        _context.CuentasCorrientes.Update(cuenta);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<MovimientoCuentaCorriente>> GetMovimientosByCuentaAsync(
        int cuentaCorrienteId, DateTime? desde, DateTime? hasta)
    {
        var query = _context.MovimientosCuentaCorriente
            .Include(m => m.Venta)
            .Include(m => m.Movimiento)
            .Include(m => m.Usuario)
            .Where(m => m.CuentaCorrienteId == cuentaCorrienteId);

        if (desde.HasValue)
            query = query.Where(m => m.FechaMovimiento >= desde.Value.Date);

        if (hasta.HasValue)
        {
            var hastaFin = hasta.Value.Date.AddDays(1);
            query = query.Where(m => m.FechaMovimiento < hastaFin);
        }

        return await query
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();
    }

    public async Task AddMovimientoAsync(MovimientoCuentaCorriente movimiento)
    {
        await _context.MovimientosCuentaCorriente.AddAsync(movimiento);
    }

    public async Task<MovimientoCuentaCorriente?> GetCargoPorVentaAsync(int ventaId)
    {
        return await _context.MovimientosCuentaCorriente
            .Include(m => m.CuentaCorriente)
            .FirstOrDefaultAsync(m => m.VentaId == ventaId
                && m.Tipo == Domain.Enums.TipoMovimientoCuentaCorriente.Cargo);
    }
}
