using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class ComboService : IComboService
{
    private readonly IComboRepository _repo;
    private readonly IHistorialPrecioService _historialService;
    private readonly ILogger<ComboService> _logger;

    public ComboService(IComboRepository repo, IHistorialPrecioService historialService, ILogger<ComboService> logger)
    {
        _repo = repo;
        _historialService = historialService;
        _logger = logger;
    }

    public async Task<IEnumerable<ComboDto>> GetAllAsync()
    {
        try
        {
            var combos = await _repo.GetAllAsync();
            return combos.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<ComboDto>> GetActivosAsync()
    {
        try
        {
            var combos = await _repo.GetActivosAsync();
            return combos.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetActivosAsync), ex.Message);
            throw;
        }
    }

    public async Task<ComboDto?> GetByIdAsync(int id)
    {
        try
        {
            var combo = await _repo.GetByIdWithDetallesAsync(id);
            return combo is null ? null : ToDto(combo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<ComboDto> CreateAsync(CrearComboDto dto)
    {
        try
        {
            if (dto.Detalles is null || !dto.Detalles.Any(d => d.ProductoId > 0 && d.Cantidad > 0))
                throw new InvalidOperationException("Debe agregar al menos un producto al combo");

            var combo = new Combo
            {
                Codigo = NormalizarCodigo(dto.Codigo),
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                Precio = dto.Precio,
                EsOfertaSemanal = dto.EsOfertaSemanal,
                Detalles = dto.Detalles.Select(d => new ComboDetalle
                {
                    ProductoId = d.ProductoId,
                    Cantidad = d.Cantidad
                }).ToList()
            };
            await _repo.AddAsync(combo);
            await _repo.SaveChangesAsync();

            var created = await _repo.GetByIdWithDetallesAsync(combo.Id);
            return ToDto(created!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<ComboDto?> UpdateAsync(int id, ActualizarComboDto dto)
    {
        try
        {
            if (dto.Detalles is null || !dto.Detalles.Any(d => d.ProductoId > 0 && d.Cantidad > 0))
                throw new InvalidOperationException("Debe agregar al menos un producto al combo");

            var combo = await _repo.GetByIdWithDetallesAsync(id);
            if (combo is null) return null;

            var precioAnterior = combo.Precio;

            combo.Codigo = NormalizarCodigo(dto.Codigo);
            combo.Nombre = dto.Nombre;
            combo.Descripcion = dto.Descripcion;
            combo.Precio = dto.Precio;
            combo.Activo = dto.Activo;
            combo.EsOfertaSemanal = dto.EsOfertaSemanal;

            combo.Detalles.Clear();
            foreach (var d in dto.Detalles)
            {
                combo.Detalles.Add(new ComboDetalle { ProductoId = d.ProductoId, Cantidad = d.Cantidad });
            }

            _repo.Update(combo);
            await _repo.SaveChangesAsync();

            if (precioAnterior != dto.Precio)
                await _historialService.RegistrarCambioAsync("Combo", id, combo.Nombre, precioAnterior, dto.Precio);

            var updated = await _repo.GetByIdWithDetallesAsync(id);
            return ToDto(updated!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var combo = await _repo.GetByIdAsync(id);
            if (combo is null) return false;

            combo.Activo = false;
            _repo.Update(combo);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static ComboDto ToDto(Combo c) => new(
        c.Id, c.Nombre, c.Descripcion, c.Precio, c.Activo,
        c.Detalles.Select(d => new ComboDetalleDto(
            d.ProductoId, d.Producto?.Nombre ?? "", d.Cantidad, d.Producto?.Precio ?? 0
        )).ToList(),
        c.EsOfertaSemanal,
        c.Codigo);

    private static string? NormalizarCodigo(string? codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo)) return null;
        return codigo.Trim().ToLowerInvariant();
    }
}
