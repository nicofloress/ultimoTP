using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class ComboService : IComboService
{
    private readonly IComboRepository _repo;

    public ComboService(IComboRepository repo) => _repo = repo;

    public async Task<IEnumerable<ComboDto>> GetAllAsync()
    {
        var combos = await _repo.GetActivosAsync();
        return combos.Select(ToDto);
    }

    public async Task<IEnumerable<ComboDto>> GetActivosAsync()
    {
        var combos = await _repo.GetActivosAsync();
        return combos.Select(ToDto);
    }

    public async Task<ComboDto?> GetByIdAsync(int id)
    {
        var combo = await _repo.GetByIdWithDetallesAsync(id);
        return combo is null ? null : ToDto(combo);
    }

    public async Task<ComboDto> CreateAsync(CrearComboDto dto)
    {
        var combo = new Combo
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
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

    public async Task<ComboDto?> UpdateAsync(int id, ActualizarComboDto dto)
    {
        var combo = await _repo.GetByIdWithDetallesAsync(id);
        if (combo is null) return null;

        combo.Nombre = dto.Nombre;
        combo.Descripcion = dto.Descripcion;
        combo.Precio = dto.Precio;
        combo.Activo = dto.Activo;

        combo.Detalles.Clear();
        foreach (var d in dto.Detalles)
        {
            combo.Detalles.Add(new ComboDetalle { ProductoId = d.ProductoId, Cantidad = d.Cantidad });
        }

        _repo.Update(combo);
        await _repo.SaveChangesAsync();

        var updated = await _repo.GetByIdWithDetallesAsync(id);
        return ToDto(updated!);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var combo = await _repo.GetByIdAsync(id);
        if (combo is null) return false;

        combo.Activo = false;
        _repo.Update(combo);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static ComboDto ToDto(Combo c) => new(
        c.Id, c.Nombre, c.Descripcion, c.Precio, c.Activo,
        c.Detalles.Select(d => new ComboDetalleDto(
            d.ProductoId, d.Producto?.Nombre ?? "", d.Cantidad, d.Producto?.Precio ?? 0
        )).ToList());
}
