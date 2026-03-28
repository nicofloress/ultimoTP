using BurgerShop.Application.Inventario.DTOs;

namespace BurgerShop.Application.Inventario.Interfaces;

public interface IMovimientoService
{
    Task<MovimientoDto> RegistrarMovimientoAsync(CrearMovimientoDto dto, int? usuarioId);
    Task<IEnumerable<MovimientoDto>> RegistrarMovimientosVentaAsync(int pedidoId, int localId, int? usuarioId);
    Task RegistrarMovimientosVentaStockAsync(int pedidoId, int localId, int? usuarioId);
    Task RegistrarMovimientosVentaCajaAsync(int pedidoId, int localId, int? usuarioId);
    Task AnularMovimientosVentaAsync(int pedidoId, int? usuarioId);
    Task<IEnumerable<MovimientoDto>> GetByLocalAsync(int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<MovimientoDto>> GetByProductoLocalAsync(int productoId, int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<MovimientoDto>> GetByPedidoAsync(int pedidoId);
    Task<IEnumerable<CodigoAccionDto>> GetCodigosAccionAsync();
}
