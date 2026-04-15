using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class MarcaService : IMarcaService
{
    private readonly IMarcaRepository _repo;
    private readonly ILogger<MarcaService> _logger;

    public MarcaService(IMarcaRepository repo, ILogger<MarcaService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<MarcaDto>> GetAllAsync()
    {
        try
        {
            var marcas = await _repo.GetAllConProveedorAsync();
            return marcas.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<MarcaDto>> GetActivasAsync()
    {
        try
        {
            var marcas = await _repo.GetActivasConProveedorAsync();
            return marcas.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetActivasAsync), ex.Message);
            throw;
        }
    }

    public async Task<MarcaDto> CreateAsync(CrearMarcaDto dto)
    {
        try
        {
            var marca = new Marca
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                ProveedorId = dto.ProveedorId,
                Activo = true
            };
            await _repo.AddAsync(marca);
            await _repo.SaveChangesAsync();

            var creada = await _repo.GetByIdConProveedorAsync(marca.Id);
            return MapToDto(creada!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<MarcaDto?> UpdateAsync(int id, ActualizarMarcaDto dto)
    {
        try
        {
            var marca = await _repo.GetByIdConProveedorAsync(id);
            if (marca is null) return null;

            marca.Nombre = dto.Nombre;
            marca.Descripcion = dto.Descripcion;
            marca.ProveedorId = dto.ProveedorId;
            marca.Activo = dto.Activo;

            _repo.Update(marca);
            await _repo.SaveChangesAsync();

            var actualizada = await _repo.GetByIdConProveedorAsync(id);
            return MapToDto(actualizada!);
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
            var marca = await _repo.GetByIdConProveedorAsync(id);
            if (marca is null) return false;

            marca.Activo = false;
            _repo.Update(marca);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static MarcaDto MapToDto(Marca m) => new MarcaDto
    {
        Id = m.Id,
        Nombre = m.Nombre,
        Descripcion = m.Descripcion,
        ProveedorId = m.ProveedorId,
        ProveedorNombre = m.Proveedor?.Nombre,
        Activo = m.Activo
    };
}
