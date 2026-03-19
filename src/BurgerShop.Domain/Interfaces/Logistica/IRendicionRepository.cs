using BurgerShop.Domain.Entities.Logistica;

namespace BurgerShop.Domain.Interfaces.Logistica;

public interface IRendicionRepository : IRepository<RendicionRepartidor>
{
    Task<RendicionRepartidor?> GetByIdConDetallesAsync(int id);
    Task<IEnumerable<RendicionRepartidor>> GetByRepartidorAsync(int repartidorId);
    Task<IEnumerable<RendicionRepartidor>> GetAllConRepartidorAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null);
    Task<RendicionRepartidor?> GetByRepartidorFechaAsync(int repartidorId, DateTime fecha);
    Task<RendicionRepartidor?> GetByRepartoZonaIdAsync(int repartoZonaId);
}
