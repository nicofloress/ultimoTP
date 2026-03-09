using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Interfaces.Ventas;

public interface IClienteRepository : IRepository<Cliente>
{
    Task<IEnumerable<Cliente>> GetAllWithNavigationsAsync();
    Task<Cliente?> GetByIdWithNavigationsAsync(int id);
    Task<IEnumerable<Cliente>> BuscarAsync(string term);
}
