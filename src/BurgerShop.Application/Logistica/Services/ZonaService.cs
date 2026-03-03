using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Logistica.Services;

public class ZonaService : IZonaService
{
    private readonly IRepository<Zona> _repo;

    public ZonaService(IRepository<Zona> repo) => _repo = repo;

    public async Task<IEnumerable<ZonaDto>> GetAllAsync()
    {
        var zonas = await _repo.GetAllAsync();
        return zonas.Select(z => new ZonaDto(z.Id, z.Nombre, z.Descripcion, z.CostoEnvio, z.Activa));
    }

    public async Task<ZonaDto?> GetByIdAsync(int id)
    {
        var z = await _repo.GetByIdAsync(id);
        return z is null ? null : new ZonaDto(z.Id, z.Nombre, z.Descripcion, z.CostoEnvio, z.Activa);
    }

    public async Task<ZonaDto> CreateAsync(CrearZonaDto dto)
    {
        var zona = new Zona { Nombre = dto.Nombre, Descripcion = dto.Descripcion, CostoEnvio = dto.CostoEnvio };
        await _repo.AddAsync(zona);
        await _repo.SaveChangesAsync();
        return new ZonaDto(zona.Id, zona.Nombre, zona.Descripcion, zona.CostoEnvio, zona.Activa);
    }

    public async Task<ZonaDto?> UpdateAsync(int id, ActualizarZonaDto dto)
    {
        var zona = await _repo.GetByIdAsync(id);
        if (zona is null) return null;

        zona.Nombre = dto.Nombre;
        zona.Descripcion = dto.Descripcion;
        zona.CostoEnvio = dto.CostoEnvio;
        zona.Activa = dto.Activa;
        _repo.Update(zona);
        await _repo.SaveChangesAsync();
        return new ZonaDto(zona.Id, zona.Nombre, zona.Descripcion, zona.CostoEnvio, zona.Activa);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var zona = await _repo.GetByIdAsync(id);
        if (zona is null) return false;

        zona.Activa = false;
        _repo.Update(zona);
        await _repo.SaveChangesAsync();
        return true;
    }
}
