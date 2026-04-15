using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces.Inventario;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Inventario.Services;

public class ArtiStockService : IArtiStockService
{
    private readonly IArtiStockRepository        _repo;
    private readonly ILogger<ArtiStockService>   _logger;

    public ArtiStockService(IArtiStockRepository repo, ILogger<ArtiStockService> logger)
    {
        _repo   = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<ArtiStockDto>> GetByLocalAsync(int localId)
    {
        try
        {
            var items = await _repo.GetByLocalAsync(localId);
            return items.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByLocalAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<ArtiStockDto>> GetStockBajoAsync(int localId)
    {
        try
        {
            var items = await _repo.GetStockBajoAsync(localId);
            return items.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetStockBajoAsync), ex.Message);
            throw;
        }
    }

    public async Task ActualizarStockMinimoAsync(ActualizarStockMinimoDto dto)
    {
        try
        {
            var artiStock = await _repo.GetByProductoLocalAsync(dto.ProductoId, dto.LocalId)
                ?? throw new InvalidOperationException(
                    $"No existe registro de stock para el producto {dto.ProductoId} en el local {dto.LocalId}.");

            artiStock.StockMinimo        = dto.StockMinimo;
            artiStock.UltimaModificacion = DateTime.UtcNow;

            await _repo.AddOrUpdateAsync(artiStock);
            await _repo.SaveChangesAsync();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(ActualizarStockMinimoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(ActualizarStockMinimoAsync), ex.Message);
            throw;
        }
    }

    // ---------------------------------------------------------------
    private static ArtiStockDto ToDto(ArtiStock a)
    {
        var bulto  = a.Producto?.UnidadesPorBulto ?? 1;
        var bultos = bulto > 0 ? Math.Round(a.StockFinal / bulto, 2) : 0;
        return new(a.ProductoId, a.Producto?.Nombre ?? string.Empty,
            a.LocalId,    a.Local?.Nombre    ?? string.Empty,
            a.IngresoLocal, a.EgresoLocal, a.VentaLocal,
            a.StockFinal, a.StockMinimo,
            a.UltimaModificacion, a.EsPuntoVenta,
            bulto, bultos);
    }
}
