using BurgerShop.Application.Logistica.DTOs;

namespace BurgerShop.Application.Logistica.Interfaces;

public interface IRepartidorService
{
    Task<IEnumerable<RepartidorDto>> GetAllAsync();
    Task<IEnumerable<RepartidorDto>> GetActivosAsync();
    Task<RepartidorDto?> GetByIdAsync(int id);
    Task<RepartidorDto> CreateAsync(CrearRepartidorDto dto);
    Task<RepartidorDto?> UpdateAsync(int id, ActualizarRepartidorDto dto);
    Task<bool> DeleteAsync(int id);
    Task<RepartidorDto?> AsignarZonasAsync(int id, List<int> zonaIds);
    Task<RepartidorLoginResultDto?> LoginAsync(string codigoAcceso);
}
