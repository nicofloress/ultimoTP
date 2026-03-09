using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IListaPrecioService
{
    Task<IEnumerable<ListaPrecioDto>> GetAllAsync();
    Task<ListaPrecioDto?> GetByIdAsync(int id);
    Task<ListaPrecioDto> CreateAsync(CrearListaPrecioDto dto);
    Task<ListaPrecioDto?> UpdateAsync(int id, ActualizarListaPrecioDto dto);
    Task<bool> DeleteAsync(int id);
    Task<ListaPrecioDetalleDto?> UpsertDetalleAsync(int listaPrecioId, UpsertDetalleDto dto);
    Task<bool> DeleteDetalleAsync(int listaPrecioId, int productoId);
    Task<decimal?> GetPrecioProductoAsync(int listaPrecioId, int productoId);
}
