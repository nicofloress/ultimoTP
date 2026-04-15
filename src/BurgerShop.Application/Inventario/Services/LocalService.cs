using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Inventario.Services;

public class LocalService : ILocalService
{
    private readonly IRepository<Local>      _repo;
    private readonly ILogger<LocalService>   _logger;

    public LocalService(IRepository<Local> repo, ILogger<LocalService> logger)
    {
        _repo   = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<LocalDto>> GetAllAsync()
    {
        try
        {
            var locales = await _repo.GetAllAsync();
            return locales.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<LocalDto?> GetByIdAsync(int id)
    {
        try
        {
            var local = await _repo.GetByIdAsync(id);
            return local is null ? null : ToDto(local);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<LocalDto> CreateAsync(CrearLocalDto dto)
    {
        try
        {
            var local = new Local
            {
                Nombre       = dto.Nombre,
                Direccion    = dto.Direccion,
                EmpresaId    = dto.EmpresaId,
                EsPuntoVenta = dto.EsPuntoVenta
            };
            await _repo.AddAsync(local);
            await _repo.SaveChangesAsync();
            return ToDto(local);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<LocalDto> UpdateAsync(int id, ActualizarLocalDto dto)
    {
        try
        {
            var local = await _repo.GetByIdAsync(id)
                ?? throw new InvalidOperationException($"Local {id} no encontrado.");

            local.Nombre       = dto.Nombre;
            local.Direccion    = dto.Direccion;
            local.EmpresaId    = dto.EmpresaId;
            local.EsPuntoVenta = dto.EsPuntoVenta;
            local.Activo       = dto.Activo;

            _repo.Update(local);
            await _repo.SaveChangesAsync();
            return ToDto(local);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task DeleteAsync(int id)
    {
        try
        {
            var local = await _repo.GetByIdAsync(id)
                ?? throw new InvalidOperationException($"Local {id} no encontrado.");

            local.Activo = false;
            _repo.Update(local);
            await _repo.SaveChangesAsync();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static LocalDto ToDto(Local l) =>
        new(l.Id, l.Nombre, l.Direccion, l.EmpresaId, l.Empresa?.NombreFantasia ?? l.Empresa?.RazonSocial, l.EsPuntoVenta, l.Activo);
}
