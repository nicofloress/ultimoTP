using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Interfaces.Ventas;

public interface IVentaRepository : IRepository<Venta>
{
    Task<Venta?> GetByIdConDetallesAsync(int id);
    Task<IEnumerable<Venta>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<Venta>> GetByRangoFechasAsync(DateTime desde, DateTime hasta);
    Task<IEnumerable<Venta>> GetByLocalAsync(int localId, DateTime? desde, DateTime? hasta);
    Task<int> GetSiguienteNumeroVentaAsync(DateTime fecha);
    Task<Venta?> GetByPedidoIdAsync(int pedidoId);
    Task<IEnumerable<Venta>> GetVentasDepositoAsync(DateTime desde, int? localId);
}
