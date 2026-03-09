using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class ListaPrecioService : IListaPrecioService
{
    private readonly IListaPrecioRepository _repo;

    public ListaPrecioService(IListaPrecioRepository repo) => _repo = repo;

    public async Task<IEnumerable<ListaPrecioDto>> GetAllAsync()
    {
        var listas = await _repo.GetAllConDetallesAsync();
        return listas.Select(ToDto);
    }

    public async Task<ListaPrecioDto?> GetByIdAsync(int id)
    {
        var lista = await _repo.GetByIdConDetallesAsync(id);
        return lista is null ? null : ToDto(lista);
    }

    public async Task<ListaPrecioDto> CreateAsync(CrearListaPrecioDto dto)
    {
        if (dto.EsDefault)
        {
            // Se desactivará en SaveChanges; guardamos primero con Id=0, luego actualizamos
            await _repo.DesactivarOtrasDefaultAsync(0);
        }

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

    public async Task<ListaPrecioDto?> UpdateAsync(int id, ActualizarListaPrecioDto dto)
    {
        var lista = await _repo.GetByIdConDetallesAsync(id);
        if (lista is null) return null;

        if (dto.EsDefault && !lista.EsDefault)
        {
            await _repo.DesactivarOtrasDefaultAsync(id);
        }

        lista.Nombre = dto.Nombre;
        lista.EsDefault = dto.EsDefault;
        lista.Activa = dto.Activa;

        _repo.Update(lista);
        await _repo.SaveChangesAsync();

        return ToDto(lista);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var lista = await _repo.GetByIdAsync(id);
        if (lista is null) return false;

        _repo.Remove(lista);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<ListaPrecioDetalleDto?> UpsertDetalleAsync(int listaPrecioId, UpsertDetalleDto dto)
    {
        var lista = await _repo.GetByIdAsync(listaPrecioId);
        if (lista is null) return null;

        var detalle = await _repo.GetDetalleAsync(listaPrecioId, dto.ProductoId);

        if (detalle is not null)
        {
            detalle.Precio = dto.Precio;
            await _repo.SaveChangesAsync();
            return new ListaPrecioDetalleDto(detalle.Id, detalle.ProductoId, detalle.Producto?.Nombre ?? "", detalle.Precio);
        }

        detalle = new ListaPrecioDetalle
        {
            ListaPrecioId = listaPrecioId,
            ProductoId = dto.ProductoId,
            Precio = dto.Precio
        };

        await _repo.AddDetalleAsync(detalle);
        await _repo.SaveChangesAsync();

        return new ListaPrecioDetalleDto(detalle.Id, detalle.ProductoId, "", detalle.Precio);
    }

    public async Task<bool> DeleteDetalleAsync(int listaPrecioId, int productoId)
    {
        var detalle = await _repo.GetDetalleAsync(listaPrecioId, productoId);
        if (detalle is null) return false;

        _repo.RemoveDetalle(detalle);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<decimal?> GetPrecioProductoAsync(int listaPrecioId, int productoId)
    {
        return await _repo.GetPrecioProductoAsync(listaPrecioId, productoId);
    }

    private static ListaPrecioDto ToDto(ListaPrecio l) => new(
        l.Id, l.Nombre, l.EsDefault, l.Activa,
        l.Detalles.Select(d => new ListaPrecioDetalleDto(d.Id, d.ProductoId, d.Producto?.Nombre ?? "", d.Precio)).ToList());
}
