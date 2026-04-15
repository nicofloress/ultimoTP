using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Ventas.Services;

public class TipoClienteService : ITipoClienteService
{
    private readonly IRepository<TipoCliente> _repo;
    private readonly ILogger<TipoClienteService> _logger;

    public TipoClienteService(IRepository<TipoCliente> repo, ILogger<TipoClienteService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<TipoClienteDto>> GetAllAsync()
    {
        try
        {
            var tipos = await _repo.GetAllAsync();
            return tipos.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<TipoClienteDto?> GetByIdAsync(int id)
    {
        try
        {
            var tipo = await _repo.GetByIdAsync(id);
            return tipo is null ? null : MapToDto(tipo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<TipoClienteDto> CreateAsync(CrearTipoClienteDto dto)
    {
        try
        {
            var tipo = new TipoCliente
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                PermiteCuentaCorriente = dto.PermiteCuentaCorriente
            };
            await _repo.AddAsync(tipo);
            await _repo.SaveChangesAsync();
            return MapToDto(tipo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<TipoClienteDto?> UpdateAsync(int id, ActualizarTipoClienteDto dto)
    {
        try
        {
            var tipo = await _repo.GetByIdAsync(id);
            if (tipo is null) return null;

            tipo.Nombre = dto.Nombre;
            tipo.Descripcion = dto.Descripcion;
            tipo.PermiteCuentaCorriente = dto.PermiteCuentaCorriente;
            _repo.Update(tipo);
            await _repo.SaveChangesAsync();
            return MapToDto(tipo);
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
            var tipo = await _repo.GetByIdAsync(id);
            if (tipo is null) return false;

            tipo.Activo = false;
            _repo.Update(tipo);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static TipoClienteDto MapToDto(TipoCliente t) => new TipoClienteDto
    {
        Id = t.Id,
        Nombre = t.Nombre,
        Descripcion = t.Descripcion,
        Activo = t.Activo,
        PermiteCuentaCorriente = t.PermiteCuentaCorriente
    };
}
