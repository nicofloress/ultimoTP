using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Logistica.Services;

public class TrackingService : ITrackingService
{
    private readonly IUbicacionRepartidorRepository _repo;
    private readonly ILogger<TrackingService> _logger;

    public TrackingService(IUbicacionRepartidorRepository repo, ILogger<TrackingService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<UbicacionDto> ActualizarUbicacionAsync(int repartidorId, ActualizarUbicacionDto dto)
    {
        try
        {
            var ubicacion = await _repo.AddOrUpdateAsync(repartidorId, dto.Latitud, dto.Longitud);
            return ToDto(ubicacion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(ActualizarUbicacionAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<UbicacionDto>> GetActivosAsync()
    {
        try
        {
            var ubicaciones = await _repo.GetActivosAsync();
            return ubicaciones.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetActivosAsync), ex.Message);
            throw;
        }
    }

    public async Task<UbicacionDto?> GetByRepartidorIdAsync(int repartidorId)
    {
        try
        {
            var ubicacion = await _repo.GetByRepartidorIdAsync(repartidorId);
            return ubicacion is null ? null : ToDto(ubicacion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByRepartidorIdAsync), ex.Message);
            throw;
        }
    }

    public async Task DesactivarAsync(int repartidorId)
    {
        try
        {
            await _repo.DesactivarAsync(repartidorId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DesactivarAsync), ex.Message);
            throw;
        }
    }

    private static UbicacionDto ToDto(UbicacionRepartidor u) => new(
        u.Id, u.RepartidorId, u.Repartidor?.Nombre ?? "Desconocido", u.Repartidor?.LocalId, u.Latitud, u.Longitud, u.FechaActualizacion, u.EstaActivo);
}
