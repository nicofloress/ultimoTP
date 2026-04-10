using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces.Inventario;

namespace BurgerShop.Application.Inventario.Services;

public class ArtiStockService : IArtiStockService
{
    private readonly IArtiStockRepository _repo;

    public ArtiStockService(IArtiStockRepository repo) => _repo = repo;

    public async Task<IEnumerable<ArtiStockDto>> GetByLocalAsync(int localId)
    {
        var items = await _repo.GetByLocalAsync(localId);
        return items.Select(ToDto);
    }

    public async Task<IEnumerable<ArtiStockDto>> GetStockBajoAsync(int localId)
    {
        var items = await _repo.GetStockBajoAsync(localId);
        return items.Select(ToDto);
    }

    public async Task ActualizarStockMinimoAsync(ActualizarStockMinimoDto dto)
    {
        var artiStock = await _repo.GetByProductoLocalAsync(dto.ProductoId, dto.LocalId)
            ?? throw new InvalidOperationException(
                $"No existe registro de stock para el producto {dto.ProductoId} en el local {dto.LocalId}.");

        artiStock.StockMinimo = dto.StockMinimo;
        artiStock.UltimaModificacion = DateTime.UtcNow;

        await _repo.AddOrUpdateAsync(artiStock);
        await _repo.SaveChangesAsync();
    }

    // ---------------------------------------------------------------
    private static ArtiStockDto ToDto(ArtiStock a)
    {
        var bulto = a.Producto?.UnidadesPorBulto ?? 1;
        var bultos = bulto > 0 ? Math.Round(a.StockFinal / bulto, 2) : 0;
        return new(a.ProductoId, a.Producto?.Nombre ?? string.Empty,
            a.LocalId,    a.Local?.Nombre    ?? string.Empty,
            a.IngresoLocal, a.EgresoLocal, a.VentaLocal,
            a.StockFinal, a.StockMinimo,
            a.UltimaModificacion, a.EsPuntoVenta,
            bulto, bultos);
    }
}
