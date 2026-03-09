using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Ventas.Services;

public class TipoClienteService : ITipoClienteService
{
    private readonly IRepository<TipoCliente> _repo;

    public TipoClienteService(IRepository<TipoCliente> repo) => _repo = repo;

    public async Task<List<TipoClienteDto>> GetAllAsync()
    {
        var tipos = await _repo.GetAllAsync();
        return tipos.Select(MapToDto).ToList();
    }

    public async Task<TipoClienteDto?> GetByIdAsync(int id)
    {
        var tipo = await _repo.GetByIdAsync(id);
        return tipo is null ? null : MapToDto(tipo);
    }

    public async Task<TipoClienteDto> CreateAsync(CrearTipoClienteDto dto)
    {
        var tipo = new TipoCliente
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion
        };
        await _repo.AddAsync(tipo);
        await _repo.SaveChangesAsync();
        return MapToDto(tipo);
    }

    public async Task<TipoClienteDto?> UpdateAsync(int id, ActualizarTipoClienteDto dto)
    {
        var tipo = await _repo.GetByIdAsync(id);
        if (tipo is null) return null;

        tipo.Nombre = dto.Nombre;
        tipo.Descripcion = dto.Descripcion;
        _repo.Update(tipo);
        await _repo.SaveChangesAsync();
        return MapToDto(tipo);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tipo = await _repo.GetByIdAsync(id);
        if (tipo is null) return false;

        tipo.Activo = false;
        _repo.Update(tipo);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static TipoClienteDto MapToDto(TipoCliente t) => new TipoClienteDto
    {
        Id = t.Id,
        Nombre = t.Nombre,
        Descripcion = t.Descripcion,
        Activo = t.Activo
    };
}
