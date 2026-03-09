using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IListaPrecioRepository : IRepository<ListaPrecio>
{
    Task<ListaPrecio?> GetByIdConDetallesAsync(int id);
    Task<IEnumerable<ListaPrecio>> GetAllConDetallesAsync();
    Task<ListaPrecioDetalle?> GetDetalleAsync(int listaPrecioId, int productoId);
    Task<decimal?> GetPrecioProductoAsync(int listaPrecioId, int productoId);
    Task DesactivarOtrasDefaultAsync(int exceptoId);
    Task AddDetalleAsync(ListaPrecioDetalle detalle);
    void RemoveDetalle(ListaPrecioDetalle detalle);
}
