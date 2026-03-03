using BurgerShop.Domain.Entities.Logistica;

namespace BurgerShop.Domain.Interfaces.Logistica;

public interface IRepartidorRepository : IRepository<Repartidor>
{
    Task<Repartidor?> GetByCodigoAccesoAsync(string codigo);
    Task<Repartidor?> GetByIdWithZonasAsync(int id);
    Task<IEnumerable<Repartidor>> GetActivosAsync();
}
