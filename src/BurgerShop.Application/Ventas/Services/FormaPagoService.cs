using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Ventas.Services;

public class FormaPagoService : IFormaPagoService
{
    private readonly IRepository<FormaPago> _repo;
    private readonly ILogger<FormaPagoService> _logger;

    public FormaPagoService(IRepository<FormaPago> repo, ILogger<FormaPagoService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<FormaPagoDto>> GetAllAsync()
    {
        try
        {
            var formas = await _repo.GetAllAsync();
            return formas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<FormaPagoDto>> GetActivasAsync()
    {
        try
        {
            var formas = await _repo.FindAsync(f => f.Activa);
            return formas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetActivasAsync), ex.Message);
            throw;
        }
    }

    public async Task<FormaPagoDto?> GetByIdAsync(int id)
    {
        try
        {
            var forma = await _repo.GetByIdAsync(id);
            return forma is null ? null : ToDto(forma);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<FormaPagoDto> CreateAsync(CrearFormaPagoDto dto)
    {
        try
        {
            var forma = new FormaPago
            {
                Nombre = dto.Nombre,
                PorcentajeRecargo = dto.PorcentajeRecargo,
                Activa = dto.Activa
            };

            await _repo.AddAsync(forma);
            await _repo.SaveChangesAsync();
            return ToDto(forma);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<FormaPagoDto?> UpdateAsync(int id, ActualizarFormaPagoDto dto)
    {
        try
        {
            var forma = await _repo.GetByIdAsync(id);
            if (forma is null) return null;

            forma.Nombre = dto.Nombre;
            forma.PorcentajeRecargo = dto.PorcentajeRecargo;
            forma.Activa = dto.Activa;

            _repo.Update(forma);
            await _repo.SaveChangesAsync();
            return ToDto(forma);
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
            var forma = await _repo.GetByIdAsync(id);
            if (forma is null) return false;

            _repo.Remove(forma);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static FormaPagoDto ToDto(FormaPago f) =>
        new(f.Id, f.Nombre, f.PorcentajeRecargo, f.Activa);
}
