using BurgerShop.Domain.Entities.Inventario;

namespace BurgerShop.Domain.Interfaces.Inventario;

public interface IMovimientoRepository : IRepository<Movimiento>
{
    Task<IEnumerable<Movimiento>> GetByLocalAsync(int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<Movimiento>> GetByProductoLocalAsync(int productoId, int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<Movimiento>> GetByPedidoAsync(int pedidoId);
}
