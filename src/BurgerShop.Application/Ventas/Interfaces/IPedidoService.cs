using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface IVentaService
{
    Task<VentaDto> CreateAsync(CrearVentaDto dto, int? usuarioId = null);
    Task<VentaDto?> UpdateAsync(int id, ActualizarVentaDto dto);
    Task<VentaDto?> GetByIdAsync(int id);
    Task<IEnumerable<VentaDto>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<VentaDto>> GetByRangoFechasAsync(DateTime desde, DateTime hasta);
    Task<IEnumerable<VentaDto>> GetByEstadoAsync(EstadoVenta estado);
    Task<VentaDto?> CambiarEstadoAsync(int id, EstadoVenta nuevoEstado);
    Task<VentaDto?> CancelarAsync(int id, string motivoCancelacion);
    Task<VentaDto?> MarcarNoEntregadoAsync(int id, string motivo);
    Task<TicketDto?> GetTicketAsync(int id);
    Task<IEnumerable<VentaDto>> GetPendientesEntregaAsync();
    Task<VentaDto?> AsignarRepartidorAsync(int ventaId, int repartidorId);
    Task<IEnumerable<VentaDto>> GetEntregasRepartidorHoyAsync(int repartidorId);
    Task<VentaDto?> MarcarEnCaminoAsync(int ventaId);
    Task<VentaDto?> MarcarEntregadoAsync(int ventaId, MarcarEntregadoDto dto);
    Task<IEnumerable<VentaDto>> GetListosParaRepartoHoyAsync();
    Task<IEnumerable<VentaDto>> EmpezarRepartoAsync(EmpezarRepartoDto dto);
    Task<int> PrepararTodosAsync();
    Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId);
    Task<VentaStatsDto> GetStatsAsync(DateTime fecha);
    Task<IEnumerable<VentaDto>> GetVentasDepositoAsync(int? localId);
}
