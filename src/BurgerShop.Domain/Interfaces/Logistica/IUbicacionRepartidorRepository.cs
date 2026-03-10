using BurgerShop.Domain.Entities.Logistica;

namespace BurgerShop.Domain.Interfaces.Logistica;

public interface IUbicacionRepartidorRepository : IRepository<UbicacionRepartidor>
{
    Task<UbicacionRepartidor?> GetByRepartidorIdAsync(int repartidorId);
    Task<IEnumerable<UbicacionRepartidor>> GetActivosAsync();
    Task<UbicacionRepartidor> AddOrUpdateAsync(int repartidorId, double latitud, double longitud);
    Task DesactivarAsync(int repartidorId);
}
