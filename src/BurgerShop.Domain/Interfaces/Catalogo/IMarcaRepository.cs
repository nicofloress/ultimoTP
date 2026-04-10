using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Interfaces.Catalogo;

public interface IMarcaRepository : IRepository<Marca>
{
    Task<IEnumerable<Marca>> GetAllConProveedorAsync();
    Task<IEnumerable<Marca>> GetActivasConProveedorAsync();
    Task<Marca?> GetByIdConProveedorAsync(int id);
}
