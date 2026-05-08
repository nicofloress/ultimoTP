using BurgerShop.Application.Ventas.DTOs;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface ICuentaCorrienteService
{
    // Consultas
    Task<CuentaCorrienteDto?>                       GetByClienteIdAsync(int clienteId);
    Task<IEnumerable<CuentaCorrienteDto>>           GetAllActivasAsync();
    Task<IEnumerable<CuentaCorrienteDto>>           GetConSaldoAsync();
    Task<IEnumerable<MovimientoCuentaCorrienteDto>> GetMovimientosAsync(
        int clienteId, DateTime? desde, DateTime? hasta);
    Task<CuentaCorrienteStatsDto>                   GetStatsAsync(int? localId);

    // Operaciones
    Task<MovimientoCuentaCorrienteDto> RegistrarCargoAsync(CrearCargoDto dto, int? usuarioId);
    Task<MovimientoCuentaCorrienteDto> RegistrarPagoAsync(CrearPagoCtaCteDto dto, int? usuarioId);
    Task<MovimientoCuentaCorrienteDto> RegistrarAjusteAsync(CrearAjusteDto dto, int? usuarioId);

    // Saldar cargo cuando la venta fue cobrada en la entrega
    Task SaldarCargoPorVentaAsync(int ventaId, int? usuarioId);

    // Gestión
    Task<CuentaCorrienteDto> ActualizarLimiteCreditoAsync(int clienteId, decimal limite);
}
