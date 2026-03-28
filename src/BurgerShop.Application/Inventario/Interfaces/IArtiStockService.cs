using BurgerShop.Application.Inventario.DTOs;

namespace BurgerShop.Application.Inventario.Interfaces;

public interface IArtiStockService
{
    Task<IEnumerable<ArtiStockDto>> GetByLocalAsync(int localId);
    Task<IEnumerable<ArtiStockDto>> GetStockBajoAsync(int localId);
    Task ActualizarStockMinimoAsync(ActualizarStockMinimoDto dto);
}
