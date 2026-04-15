using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Logistica.Services;

public class MensajeService : IMensajeService
{
    private readonly IMensajeRepository _repo;
    private readonly ILogger<MensajeService> _logger;

    public MensajeService(IMensajeRepository repo, ILogger<MensajeService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<MensajeDto>> GetByRepartidorAsync(int repartidorId)
    {
        try
        {
            var mensajes = await _repo.GetByRepartidorAsync(repartidorId);
            return mensajes.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByRepartidorAsync), ex.Message);
            throw;
        }
    }

    public async Task<MensajeDto> EnviarMensajeAsync(CrearMensajeDto dto, bool esDeAdmin)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(EnviarMensajeAsync), ex.Message);
            throw;
        }
    }

    public async Task MarcarLeidosAsync(int repartidorId, bool esDeAdmin)
    {
        try
        {
            await _repo.MarcarLeidosAsync(repartidorId, esDeAdmin);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(MarcarLeidosAsync), ex.Message);
            throw;
        }
    }

    public async Task<int> GetNoLeidosCountAsync(int repartidorId, bool esDeAdmin)
    {
        try
        {
            return await _repo.GetNoLeidosCountAsync(repartidorId, esDeAdmin);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetNoLeidosCountAsync), ex.Message);
            throw;
        }
    }

    private static MensajeDto ToDto(Mensaje m) => new(
        m.Id, m.RepartidorId, m.Texto, m.EsDeAdmin, m.FechaEnvio, m.Leido);
}
