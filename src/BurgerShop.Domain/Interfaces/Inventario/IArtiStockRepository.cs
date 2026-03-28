using BurgerShop.Domain.Entities.Inventario;

namespace BurgerShop.Domain.Interfaces.Inventario;

public interface IArtiStockRepository
{
    Task<ArtiStock?> GetByProductoLocalAsync(int productoId, int localId);
    Task<IEnumerable<ArtiStock>> GetByLocalAsync(int localId);
    Task<IEnumerable<ArtiStock>> GetStockBajoAsync(int localId);
    Task AddOrUpdateAsync(ArtiStock artiStock);
    Task<int> SaveChangesAsync();
}
