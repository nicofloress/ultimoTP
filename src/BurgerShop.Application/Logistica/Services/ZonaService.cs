using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Logistica.Services;

public class ZonaService : IZonaService
{
    private readonly IRepository<Zona> _repo;
    private readonly ILogger<ZonaService> _logger;

    public ZonaService(IRepository<Zona> repo, ILogger<ZonaService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<ZonaDto>> GetAllAsync()
    {
        try
        {
            var zonas = await _repo.GetAllAsync();
            return zonas.Select(z => new ZonaDto(z.Id, z.Nombre, z.Descripcion, z.CostoEnvio, z.Activa, z.LocalId, z.Local?.Nombre));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<ZonaDto?> GetByIdAsync(int id)
    {
        try
        {
            var z = await _repo.GetByIdAsync(id);
            return z is null ? null : new ZonaDto(z.Id, z.Nombre, z.Descripcion, z.CostoEnvio, z.Activa, z.LocalId, z.Local?.Nombre);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<ZonaDto> CreateAsync(CrearZonaDto dto)
    {
        try
        {
            var zona = new Zona { Nombre = dto.Nombre, Descripcion = dto.Descripcion, CostoEnvio = dto.CostoEnvio, LocalId = dto.LocalId };
            await _repo.AddAsync(zona);
            await _repo.SaveChangesAsync();
            return new ZonaDto(zona.Id, zona.Nombre, zona.Descripcion, zona.CostoEnvio, zona.Activa, zona.LocalId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<ZonaDto?> UpdateAsync(int id, ActualizarZonaDto dto)
    {
        try
        {
            var zona = await _repo.GetByIdAsync(id);
            if (zona is null) return null;

            zona.Nombre = dto.Nombre;
            zona.Descripcion = dto.Descripcion;
            zona.CostoEnvio = dto.CostoEnvio;
            zona.Activa = dto.Activa;
            zona.LocalId = dto.LocalId;
            _repo.Update(zona);
            await _repo.SaveChangesAsync();
            return new ZonaDto(zona.Id, zona.Nombre, zona.Descripcion, zona.CostoEnvio, zona.Activa, zona.LocalId, zona.Local?.Nombre);
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
            var zona = await _repo.GetByIdAsync(id);
            if (zona is null) return false;

            zona.Activa = false;
            _repo.Update(zona);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }
}
