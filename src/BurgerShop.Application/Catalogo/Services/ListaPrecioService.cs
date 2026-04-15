using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class ListaPrecioService : IListaPrecioService
{
    private readonly IListaPrecioRepository _repo;
    private readonly ILogger<ListaPrecioService> _logger;

    public ListaPrecioService(IListaPrecioRepository repo, ILogger<ListaPrecioService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<ListaPrecioDto>> GetAllAsync()
    {
        try
        {
            var listas = await _repo.GetAllConDetallesAsync();
            return listas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<ListaPrecioDto?> GetByIdAsync(int id)
    {
        try
        {
            var lista = await _repo.GetByIdConDetallesAsync(id);
            return lista is null ? null : ToDto(lista);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<ListaPrecioDto> CreateAsync(CrearListaPrecioDto dto)
    {
        try
        {
            if (dto.EsDefault)
                await _repo.DesactivarOtrasDefaultAsync(0);

            var lista = new ListaPrecio
            {
                Nombre = dto.Nombre,
                EsDefault = dto.EsDefault,
                Activa = true
            };

            await _repo.AddAsync(lista);
            await _repo.SaveChangesAsync();

            return new ListaPrecioDto(lista.Id, lista.Nombre, lista.EsDefault, lista.Activa, new List<ListaPrecioDetalleDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<ListaPrecioDto?> UpdateAsync(int id, ActualizarListaPrecioDto dto)
    {
        try
        {
            var lista = await _repo.GetByIdConDetallesAsync(id);
            if (lista is null) return null;

            if (dto.EsDefault && !lista.EsDefault)
                await _repo.DesactivarOtrasDefaultAsync(id);

            lista.Nombre = dto.Nombre;
            lista.EsDefault = dto.EsDefault;
            lista.Activa = dto.Activa;

            _repo.Update(lista);
            await _repo.SaveChangesAsync();

            return ToDto(lista);
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
            var lista = await _repo.GetByIdAsync(id);
            if (lista is null) return false;

            _repo.Remove(lista);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    public async Task<ListaPrecioDetalleDto?> UpsertDetalleAsync(int listaPrecioId, UpsertDetalleDto dto)
    {
        try
        {
            var lista = await _repo.GetByIdAsync(listaPrecioId);
            if (lista is null) return null;

            if (dto.ComboId.HasValue)
            {
                var detalle = await _repo.GetDetalleComboAsync(listaPrecioId, dto.ComboId.Value);
                if (detalle is not null)
                {
                    detalle.Precio = dto.Precio;
                    await _repo.SaveChangesAsync();
                    return new ListaPrecioDetalleDto(detalle.Id, null, null, detalle.ComboId, detalle.Combo?.Nombre ?? "", detalle.Precio);
                }
                detalle = new ListaPrecioDetalle
                {
                    ListaPrecioId = listaPrecioId,
                    ComboId = dto.ComboId.Value,
                    Precio = dto.Precio
                };
                await _repo.AddDetalleAsync(detalle);
                await _repo.SaveChangesAsync();
                return new ListaPrecioDetalleDto(detalle.Id, null, null, detalle.ComboId, "", detalle.Precio);
            }

            if (dto.ProductoId.HasValue)
            {
                var detalle = await _repo.GetDetalleAsync(listaPrecioId, dto.ProductoId.Value);
                if (detalle is not null)
                {
                    detalle.Precio = dto.Precio;
                    await _repo.SaveChangesAsync();
                    return new ListaPrecioDetalleDto(detalle.Id, detalle.ProductoId, detalle.Producto?.Nombre ?? "", null, null, detalle.Precio);
                }
                detalle = new ListaPrecioDetalle
                {
                    ListaPrecioId = listaPrecioId,
                    ProductoId = dto.ProductoId.Value,
                    Precio = dto.Precio
                };
                await _repo.AddDetalleAsync(detalle);
                await _repo.SaveChangesAsync();
                return new ListaPrecioDetalleDto(detalle.Id, detalle.ProductoId, "", null, null, detalle.Precio);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpsertDetalleAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteDetalleAsync(int listaPrecioId, int productoId)
    {
        try
        {
            var detalle = await _repo.GetDetalleAsync(listaPrecioId, productoId);
            if (detalle is null) return false;

            _repo.RemoveDetalle(detalle);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteDetalleAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteDetalleComboAsync(int listaPrecioId, int comboId)
    {
        try
        {
            var detalle = await _repo.GetDetalleComboAsync(listaPrecioId, comboId);
            if (detalle is null) return false;

            _repo.RemoveDetalle(detalle);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteDetalleComboAsync), ex.Message);
            throw;
        }
    }

    public async Task<decimal?> GetPrecioProductoAsync(int listaPrecioId, int productoId)
    {
        try
        {
            return await _repo.GetPrecioProductoAsync(listaPrecioId, productoId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetPrecioProductoAsync), ex.Message);
            throw;
        }
    }

    private static ListaPrecioDto ToDto(ListaPrecio l) => new(
        l.Id, l.Nombre, l.EsDefault, l.Activa,
        l.Detalles.Select(d => new ListaPrecioDetalleDto(
            d.Id, d.ProductoId, d.Producto?.Nombre, d.ComboId, d.Combo?.Nombre, d.Precio
        )).ToList());
}
