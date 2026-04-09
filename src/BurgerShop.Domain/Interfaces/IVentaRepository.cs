using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Interfaces;

public interface IVentaRepository : IRepository<Venta>
{
    Task<Venta?> GetByIdWithLineasAsync(int id);
    Task<IEnumerable<Venta>> GetByFechaAsync(DateTime fecha);
    Task<IEnumerable<Venta>> GetByRangoFechasAsync(DateTime desde, DateTime hasta);
    Task<IEnumerable<Venta>> GetByEstadoAsync(EstadoVenta estado);
    Task<IEnumerable<Venta>> GetByRepartidorHoyAsync(int repartidorId);
    Task<IEnumerable<Venta>> GetPendientesEntregaAsync();
    Task<IEnumerable<Venta>> GetListosParaRepartoHoyAsync();
    Task<IEnumerable<Venta>> GetListosParaRepartoConProductosAsync();
    Task<IEnumerable<Venta>> GetActivosConProductosPorRepartidorHoyAsync();
    Task<IEnumerable<Venta>> GetTodosConProductosPorRepartidorHoyAsync();
    Task<IEnumerable<Venta>> GetConProductosPorRepartoZonaAsync(int repartoZonaId);
    Task<int> GetSiguienteNumeroTicketAsync(DateTime fecha);
    Task<IEnumerable<Venta>> GetByCierreCajaAsync(int cierreCajaId);
    Task<int?> GetRepartidorActivoEnZonaHoyAsync(int zonaId);

    // RepartoZona
    Task<RepartoZona> CrearRepartoZonaAsync(int zonaId, int repartidorId, int totalVentas);
    Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId);
    Task GuardarTallyRepartoAsync(int zonaId, int repartidorId, string tallyJson);
    Task<RepartoZona?> GetRepartoZonaActivoHoyAsync(int zonaId);
    Task IncrementarContadorRepartoAsync(int zonaId, EstadoVenta estadoFinal);
    Task IncrementarTotalVentasRepartoAsync(int zonaId);
    Task<List<RepartoZona>> GetRepartosZonaByRepartidorHoyAsync(int repartidorId);
    Task<List<RepartoZona>> GetRepartosZonaByRepartidorFechaAsync(int repartidorId, DateTime fecha);
    Task<List<RepartoZona>> GetRepartosZonaFinalizadosHoyAsync();
    Task<List<RepartoZona>> GetRepartosZonaFinalizadosByFechaAsync(DateTime fecha);

    // Stats
    Task<int> GetCountByFechaAsync(DateTime fecha);
    Task<int> GetCountByRangoAsync(DateTime desde, DateTime hasta);
    Task<(decimal Total, int Count)> GetTotalesByFechaAsync(DateTime fecha);

    // Métodos incorporados de la Venta simple
    Task<int> GetSiguienteNumeroVentaAsync(DateTime fecha);
    Task<IEnumerable<Venta>> GetByLocalAsync(int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<Venta>> GetVentasDepositoAsync(DateTime desde, int? localId);
}
