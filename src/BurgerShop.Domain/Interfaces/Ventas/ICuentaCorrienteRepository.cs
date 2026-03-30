using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Interfaces.Ventas;

public interface ICuentaCorrienteRepository
{
    Task<CuentaCorriente?>              GetByClienteIdAsync(int clienteId);
    Task<CuentaCorriente?>              GetByIdAsync(int id);
    Task<CuentaCorriente?>              GetByIdConMovimientosAsync(int id);
    Task<IEnumerable<CuentaCorriente>>  GetAllActivasAsync();
    Task<IEnumerable<CuentaCorriente>>  GetConSaldoAsync();   // SaldoActual > 0

    Task AddAsync(CuentaCorriente cuenta);
    void Update(CuentaCorriente cuenta);
    Task<int> SaveChangesAsync();

    // Movimientos
    Task<IEnumerable<MovimientoCuentaCorriente>> GetMovimientosByCuentaAsync(
        int cuentaCorrienteId, DateTime? desde, DateTime? hasta);
    Task AddMovimientoAsync(MovimientoCuentaCorriente movimiento);
    Task<MovimientoCuentaCorriente?> GetCargoPorPedidoAsync(int pedidoId);
}
