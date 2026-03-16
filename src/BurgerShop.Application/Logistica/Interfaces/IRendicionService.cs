using BurgerShop.Application.Logistica.DTOs;

namespace BurgerShop.Application.Logistica.Interfaces;

public interface IRendicionService
{
    Task<RendicionDto> CrearRendicionAsync(CrearRendicionDto dto);
    Task<IEnumerable<RendicionDto>> GetByRepartidorAsync(int repartidorId);
    Task<IEnumerable<RendicionDto>> GetAllAsync(DateTime? fecha = null);
    Task<RendicionDto?> GetByIdAsync(int id);
    Task<RendicionDto?> AprobarAsync(int id, AprobarRendicionDto dto);
    Task<EstadoRepartoRepartidorDto> GetEstadoRepartoAsync(int repartidorId);
}
