using BurgerShop.Application.Logistica.DTOs;

namespace BurgerShop.Application.Logistica.Interfaces;

public interface ITrackingService
{
    Task<UbicacionDto> ActualizarUbicacionAsync(int repartidorId, ActualizarUbicacionDto dto);
    Task<IEnumerable<UbicacionDto>> GetActivosAsync();
    Task<UbicacionDto?> GetByRepartidorIdAsync(int repartidorId);
    Task DesactivarAsync(int repartidorId);
}
