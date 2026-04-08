using BurgerShop.Domain.Entities.Finanzas;

namespace BurgerShop.Domain.Interfaces.Finanzas;

public interface IGastoRepository : IRepository<Gasto>
{
    Task<IEnumerable<Gasto>> GetAllConDetallesAsync();
    Task<IEnumerable<Gasto>> GetByLocalAsync(int localId);
    Task<Gasto?> GetByIdConDetallesAsync(int id);
}
