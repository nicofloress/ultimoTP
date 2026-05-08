using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Inventario;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Inventario.Services;

public class ArtiStockService : IArtiStockService
{
    private readonly IArtiStockRepository        _repo;
    private readonly IRepository<Producto>       _productoRepo;
    private readonly ILogger<ArtiStockService>   _logger;

    public ArtiStockService(IArtiStockRepository repo, IRepository<Producto> productoRepo, ILogger<ArtiStockService> logger)
    {
        _repo         = repo;
        _productoRepo = productoRepo;
        _logger       = logger;
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

    /// <summary>
    /// Setea stock positivo (cantidad dada) para todos los productos activos en un local.
    /// Para registros existentes ajusta IngresoLocal para que StockFinal = cantidad respetando egresos/ventas previas.
    /// Para productos sin registro en el local, crea uno nuevo.
    /// </summary>
    public async Task<(int creados, int actualizados)> SeedStockPositivoAsync(int localId, decimal cantidad)
    {
        if (cantidad < 0) throw new InvalidOperationException("La cantidad no puede ser negativa.");

        var existentes = (await _repo.GetByLocalAsync(localId)).ToList();
        var existentesIds = existentes.Select(e => e.ProductoId).ToHashSet();
        var productos = (await _productoRepo.FindAsync(p => p.Activo)).ToList();

        var ahora = DateTime.UtcNow;
        int actualizados = 0;
        int creados = 0;

        foreach (var existente in existentes)
        {
            existente.IngresoLocal = existente.EgresoLocal + existente.VentaLocal + cantidad;
            existente.StockFinal = cantidad;
            existente.UltimaModificacion = ahora;
            await _repo.AddOrUpdateAsync(existente);
            actualizados++;
        }

        foreach (var producto in productos.Where(p => !existentesIds.Contains(p.Id)))
        {
            var nuevo = new ArtiStock
            {
                ProductoId = producto.Id,
                LocalId = localId,
                IngresoLocal = cantidad,
                EgresoLocal = 0,
                VentaLocal = 0,
                StockFinal = cantidad,
                UltimaModificacion = ahora,
                EsPuntoVenta = true,
            };
            await _repo.AddOrUpdateAsync(nuevo);
            creados++;
        }

        await _repo.SaveChangesAsync();
        return (creados, actualizados);
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
