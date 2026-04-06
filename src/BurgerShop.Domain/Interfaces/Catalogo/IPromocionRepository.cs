using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IPromocionRepository : IRepository<Promocion>
{
    Task<Promocion?> GetByIdConDetallesAsync(int id);
    Task<IEnumerable<Promocion>> GetAllConDetallesAsync();
    Task<IEnumerable<Promocion>> GetVigentesParaLocalAsync(int localId);
}
