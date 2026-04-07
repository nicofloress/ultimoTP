using BurgerShop.Application.Finanzas.DTOs;

namespace BurgerShop.Application.Finanzas.Interfaces;

public interface ICierreCajaService
{
    Task<CierreCajaDto?> GetCajaAbiertaAsync(int? localId = null);
    Task<CierreCajaDto> AbrirCajaAsync(AbrirCajaDto dto);
    Task<CierreCajaDto?> CerrarCajaAsync(int id, CerrarCajaDto dto);
    Task<IEnumerable<CierreCajaDto>> GetHistorialAsync(int? localId = null);
    Task<CierreCajaDto?> GetByIdAsync(int id);
}
