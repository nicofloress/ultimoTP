using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IComboRepository : IRepository<Combo>
{
    Task<Combo?> GetByIdWithDetallesAsync(int id);
    Task<IEnumerable<Combo>> GetActivosAsync();
}
