using BurgerShop.Application.Ventas.DTOs;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface IVentaService
{
    Task<VentaDto> CrearVentaMostradorAsync(CrearVentaDto dto, int? usuarioId);
    Task<VentaDto> CrearVentaDomicilioAsync(int pedidoId, int localId, int? usuarioId);
    Task<VentaDto?> GetByIdAsync(int id);
    Task<IEnumerable<VentaDto>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<VentaDto>> GetByRangoFechasAsync(DateTime desde, DateTime hasta);
    Task<VentaDto?> GetByPedidoIdAsync(int pedidoId);
}
