using BurgerShop.Application.Finanzas.DTOs;

namespace BurgerShop.Application.Finanzas.Interfaces;

public interface ICierreCajaService
{
    Task<CierreCajaDto?> GetCajaAbiertaAsync();
    Task<CierreCajaDto> AbrirCajaAsync(AbrirCajaDto dto);
    Task<CierreCajaDto?> CerrarCajaAsync(int id, CerrarCajaDto dto);
    Task<IEnumerable<CierreCajaDto>> GetHistorialAsync();
    Task<CierreCajaDto?> GetByIdAsync(int id);
}
