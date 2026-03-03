using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IProductoRepository : IRepository<Producto>
{
    Task<IEnumerable<Producto>> GetByCategoriaAsync(int categoriaId);
    Task<IEnumerable<Producto>> GetActivosAsync();
}
