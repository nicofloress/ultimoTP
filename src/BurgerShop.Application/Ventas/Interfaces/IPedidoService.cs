using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Ventas.Interfaces;

public interface IPedidoService
{
    Task<PedidoDto> CreateAsync(CrearPedidoDto dto);
    Task<PedidoDto?> UpdateAsync(int id, ActualizarPedidoDto dto);
    Task<PedidoDto?> GetByIdAsync(int id);
    Task<IEnumerable<PedidoDto>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<PedidoDto>> GetByEstadoAsync(EstadoPedido estado);
    Task<PedidoDto?> CambiarEstadoAsync(int id, EstadoPedido nuevoEstado);
    Task<PedidoDto?> CancelarAsync(int id, string motivoCancelacion);
    Task<PedidoDto?> MarcarNoEntregadoAsync(int id, string motivo);
    Task<TicketDto?> GetTicketAsync(int id);
    Task<IEnumerable<PedidoDto>> GetPendientesEntregaAsync();
    Task<PedidoDto?> AsignarRepartidorAsync(int pedidoId, int repartidorId);
    Task<IEnumerable<PedidoDto>> GetEntregasRepartidorHoyAsync(int repartidorId);
    Task<PedidoDto?> MarcarEnCaminoAsync(int pedidoId);
    Task<PedidoDto?> MarcarEntregadoAsync(int pedidoId, MarcarEntregadoDto dto);
    Task<IEnumerable<PedidoDto>> GetListosParaRepartoHoyAsync();
    Task<IEnumerable<PedidoDto>> EmpezarRepartoAsync(EmpezarRepartoDto dto);
    Task<int> PrepararTodosAsync();
    Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId);
}
