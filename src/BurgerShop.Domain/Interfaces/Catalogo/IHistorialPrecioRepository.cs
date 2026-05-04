using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IHistorialPrecioRepository : IRepository<HistorialPrecio>
{
    Task<IEnumerable<HistorialPrecio>> GetByEntidadAsync(string tipoEntidad, int entidadId);
    Task<IEnumerable<HistorialPrecio>> GetRecientesAsync(int cantidad = 50);
}
