using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Interfaces;

public interface IPedidoRepository : IRepository<Pedido>
{
    Task<Pedido?> GetByIdWithLineasAsync(int id);
    Task<IEnumerable<Pedido>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<Pedido>> GetByEstadoAsync(EstadoPedido estado);
    Task<IEnumerable<Pedido>> GetByRepartidorHoyAsync(int repartidorId);
    Task<IEnumerable<Pedido>> GetPendientesEntregaAsync();
    Task<IEnumerable<Pedido>> GetListosParaRepartoHoyAsync();
    Task<IEnumerable<Pedido>> GetListosParaRepartoConProductosAsync();
    Task<int> GetSiguienteNumeroTicketAsync(DateTime fecha);
    Task<IEnumerable<Pedido>> GetByCierreCajaAsync(int cierreCajaId);
    Task<int?> GetRepartidorActivoEnZonaHoyAsync(int zonaId);
}
