using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IPromocionService
{
    Task<IEnumerable<PromocionDto>> GetAllAsync();
    Task<PromocionDto?> GetByIdAsync(int id);
    Task<IEnumerable<PromocionDto>> GetVigentesParaLocalAsync(int localId);
    Task<PromocionDto> CreateAsync(CrearPromocionDto dto);
    Task<PromocionDto?> UpdateAsync(int id, ActualizarPromocionDto dto);
    Task<bool> DeleteAsync(int id);
}
