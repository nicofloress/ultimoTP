using BurgerShop.Application.Logistica.DTOs;

namespace BurgerShop.Application.Logistica.Interfaces;

public interface IMensajeService
{
    Task<IEnumerable<MensajeDto>> GetByRepartidorAsync(int repartidorId);
    Task<MensajeDto> EnviarMensajeAsync(CrearMensajeDto dto, bool esDeAdmin);
    Task MarcarLeidosAsync(int repartidorId, bool esDeAdmin);
    Task<int> GetNoLeidosCountAsync(int repartidorId, bool esDeAdmin);
}
