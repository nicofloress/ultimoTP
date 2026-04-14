using BurgerShop.Application.Inventario.DTOs;

namespace BurgerShop.Application.Inventario.Interfaces;

public interface IMovimientoService
{
    Task<MovimientoDto> RegistrarMovimientoAsync(CrearMovimientoDto dto, int? usuarioId);
    Task<MovimientoDto> RegistrarDevolucionAsync(CrearDevolucionDto dto, int? usuarioId);
    Task<IEnumerable<MovimientoDto>> RegistrarMovimientosVentaAsync(int ventaId, int localId, int? usuarioId);
    Task RegistrarMovimientosVentaStockAsync(int ventaId, int localId, int? usuarioId);
    Task RegistrarMovimientosVentaCajaAsync(int ventaId, int localId, int? usuarioId);
    Task AnularMovimientosVentaAsync(int ventaId, int? usuarioId);
    Task<IEnumerable<MovimientoDto>> GetByLocalAsync(int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<MovimientoDto>> GetByProductoLocalAsync(int productoId, int localId, DateTime? desde, DateTime? hasta);
    Task<IEnumerable<MovimientoDto>> GetByVentaAsync(int ventaId);
    Task<IEnumerable<CodigoAccionDto>> GetCodigosAccionAsync();
}
