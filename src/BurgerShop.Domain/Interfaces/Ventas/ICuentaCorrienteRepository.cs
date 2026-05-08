using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Interfaces.Ventas;

public interface ICuentaCorrienteRepository
{
    Task<CuentaCorriente?>              GetByClienteIdAsync(int clienteId);
    Task<CuentaCorriente?>              GetByIdAsync(int id);
    Task<CuentaCorriente?>              GetByIdConMovimientosAsync(int id);
    Task<IEnumerable<CuentaCorriente>>  GetAllActivasAsync();
    Task<IEnumerable<CuentaCorriente>>  GetConSaldoAsync();   // SaldoActual > 0
    Task<IEnumerable<CuentaCorriente>>  GetConSaldoAsync(int? localId);   // Filtrado por local del cliente

    Task AddAsync(CuentaCorriente cuenta);
    void Update(CuentaCorriente cuenta);
    Task<int> SaveChangesAsync();

    // Movimientos
    Task<IEnumerable<MovimientoCuentaCorriente>> GetMovimientosByCuentaAsync(
        int cuentaCorrienteId, DateTime? desde, DateTime? hasta);
    Task AddMovimientoAsync(MovimientoCuentaCorriente movimiento);
    Task<MovimientoCuentaCorriente?> GetCargoPorVentaAsync(int ventaId);

    // Stats: movimientos en rango (filtrados opcionalmente por local del cliente)
    Task<IEnumerable<MovimientoCuentaCorriente>> GetMovimientosEnRangoAsync(
        DateTime desde, DateTime hasta, int? localId);
}
