using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;

namespace BurgerShop.Application.Logistica.Services;

public class TrackingService : ITrackingService
{
    private readonly IUbicacionRepartidorRepository _repo;

    public TrackingService(IUbicacionRepartidorRepository repo) => _repo = repo;

    public async Task<UbicacionDto> ActualizarUbicacionAsync(int repartidorId, ActualizarUbicacionDto dto)
    {
        var ubicacion = await _repo.AddOrUpdateAsync(repartidorId, dto.Latitud, dto.Longitud);
        return ToDto(ubicacion);
    }

    public async Task<IEnumerable<UbicacionDto>> GetActivosAsync()
    {
        var ubicaciones = await _repo.GetActivosAsync();
        return ubicaciones.Select(ToDto);
    }

    public async Task<UbicacionDto?> GetByRepartidorIdAsync(int repartidorId)
    {
        var ubicacion = await _repo.GetByRepartidorIdAsync(repartidorId);
        return ubicacion is null ? null : ToDto(ubicacion);
    }

    public async Task DesactivarAsync(int repartidorId)
    {
        await _repo.DesactivarAsync(repartidorId);
    }

    private static UbicacionDto ToDto(UbicacionRepartidor u) => new(
        u.Id, u.RepartidorId, u.Repartidor?.Nombre ?? "Desconocido", u.Latitud, u.Longitud, u.FechaActualizacion, u.EstaActivo);
}
