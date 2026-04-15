using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Logistica.Services;

public class RepartidorService : IRepartidorService
{
    private readonly IRepartidorRepository _repo;
    private readonly ILogger<RepartidorService> _logger;

    public RepartidorService(IRepartidorRepository repo, ILogger<RepartidorService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<RepartidorDto>> GetAllAsync()
    {
        try
        {
            var repartidores = await _repo.GetAllAsync();
            return repartidores.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<RepartidorDto>> GetActivosAsync()
    {
        try
        {
            var repartidores = await _repo.GetActivosAsync();
            return repartidores.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetActivosAsync), ex.Message);
            throw;
        }
    }

    public async Task<RepartidorDto?> GetByIdAsync(int id)
    {
        try
        {
            var r = await _repo.GetByIdWithZonasAsync(id);
            return r is null ? null : ToDto(r);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<RepartidorDto> CreateAsync(CrearRepartidorDto dto)
    {
        try
        {
            var repartidor = new Repartidor
            {
                Nombre = dto.Nombre,
                Telefono = dto.Telefono,
                Vehiculo = dto.Vehiculo,
                LocalId = dto.LocalId
            };
            await _repo.AddAsync(repartidor);
            await _repo.SaveChangesAsync();
            return ToDto(repartidor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<RepartidorDto?> UpdateAsync(int id, ActualizarRepartidorDto dto)
    {
        try
        {
            var repartidor = await _repo.GetByIdWithZonasAsync(id);
            if (repartidor is null) return null;

            repartidor.Nombre = dto.Nombre;
            repartidor.Telefono = dto.Telefono;
            repartidor.Vehiculo = dto.Vehiculo;
            repartidor.Activo = dto.Activo;
            repartidor.LocalId = dto.LocalId;

            _repo.Update(repartidor);
            await _repo.SaveChangesAsync();
            return ToDto(repartidor);
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
            var repartidor = await _repo.GetByIdAsync(id);
            if (repartidor is null) return false;

            repartidor.Activo = false;
            _repo.Update(repartidor);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    public async Task<RepartidorDto?> AsignarZonasAsync(int id, List<int> zonaIds)
    {
        try
        {
            var repartidor = await _repo.GetByIdWithZonasAsync(id);
            if (repartidor is null) return null;

            repartidor.RepartidorZonas.Clear();
            foreach (var zonaId in zonaIds)
            {
                repartidor.RepartidorZonas.Add(new RepartidorZona { RepartidorId = id, ZonaId = zonaId });
            }

            _repo.Update(repartidor);
            await _repo.SaveChangesAsync();

            var updated = await _repo.GetByIdWithZonasAsync(id);
            return ToDto(updated!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(AsignarZonasAsync), ex.Message);
            throw;
        }
    }

    public async Task<RepartidorLoginResultDto?> LoginAsync(string codigoAcceso)
    {
        try
        {
            var repartidor = await _repo.GetByCodigoAccesoAsync(codigoAcceso);
            if (repartidor is null) return null;
            return new RepartidorLoginResultDto(repartidor.Id, repartidor.Nombre);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(LoginAsync), ex.Message);
            throw;
        }
    }

    private static RepartidorDto ToDto(Repartidor r) => new(
        r.Id, r.Nombre, r.Telefono, r.Vehiculo, r.Activo,
        r.RepartidorZonas?.Select(rz => new ZonaDto(
            rz.Zona?.Id ?? rz.ZonaId,
            rz.Zona?.Nombre ?? "",
            rz.Zona?.Descripcion,
            rz.Zona?.CostoEnvio ?? 0,
            rz.Zona?.Activa ?? true,
            rz.Zona?.LocalId,
            rz.Zona?.Local?.Nombre
        )).ToList() ?? new List<ZonaDto>(),
        r.LocalId,
        r.Local?.Nombre);
}
