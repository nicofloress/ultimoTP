using BurgerShop.Domain.Entities.Finanzas;

namespace BurgerShop.Domain.Interfaces.Finanzas;

public interface ICierreCajaRepository : IRepository<CierreCaja>
{
    Task<CierreCaja?> GetCajaAbiertaAsync();
    Task<CierreCaja?> GetByIdConDetallesAsync(int id);
    Task<IEnumerable<CierreCaja>> GetHistorialAsync(int cantidad = 20);
}
