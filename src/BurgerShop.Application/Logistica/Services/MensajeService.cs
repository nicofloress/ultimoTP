using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;

namespace BurgerShop.Application.Logistica.Services;

public class MensajeService : IMensajeService
{
    private readonly IMensajeRepository _repo;

    public MensajeService(IMensajeRepository repo) => _repo = repo;

    public async Task<IEnumerable<MensajeDto>> GetByRepartidorAsync(int repartidorId)
    {
        var mensajes = await _repo.GetByRepartidorAsync(repartidorId);
        return mensajes.Select(ToDto);
    }

    public async Task<MensajeDto> EnviarMensajeAsync(CrearMensajeDto dto, bool esDeAdmin)
    {
        var mensaje = new Mensaje
        {
            RepartidorId = dto.RepartidorId,
            Texto = dto.Texto,
            EsDeAdmin = esDeAdmin,
            FechaEnvio = DateTime.UtcNow,
            Leido = false
        };

        await _repo.AddAsync(mensaje);
        await _repo.SaveChangesAsync();
        return ToDto(mensaje);
    }

    public async Task MarcarLeidosAsync(int repartidorId, bool esDeAdmin)
    {
        await _repo.MarcarLeidosAsync(repartidorId, esDeAdmin);
    }

    public async Task<int> GetNoLeidosCountAsync(int repartidorId, bool esDeAdmin)
    {
        return await _repo.GetNoLeidosCountAsync(repartidorId, esDeAdmin);
    }

    private static MensajeDto ToDto(Mensaje m) => new(
        m.Id, m.RepartidorId, m.Texto, m.EsDeAdmin, m.FechaEnvio, m.Leido);
}
