using BurgerShop.Domain.Entities.Logistica;

namespace BurgerShop.Domain.Interfaces.Logistica;

public interface IMensajeRepository : IRepository<Mensaje>
{
    Task<IEnumerable<Mensaje>> GetByRepartidorAsync(int repartidorId);
    Task<int> MarcarLeidosAsync(int repartidorId, bool esDeAdmin);
    Task<int> GetNoLeidosCountAsync(int repartidorId, bool esDeAdmin);
}
