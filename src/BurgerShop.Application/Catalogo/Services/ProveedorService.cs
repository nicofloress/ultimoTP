using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class ProveedorService : IProveedorService
{
    private readonly IRepository<Proveedor> _repo;
    private readonly ILogger<ProveedorService> _logger;

    public ProveedorService(IRepository<Proveedor> repo, ILogger<ProveedorService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<ProveedorDto>> GetAllAsync()
    {
        try
        {
            var proveedores = await _repo.GetAllAsync();
            return proveedores.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<ProveedorDto?> GetByIdAsync(int id)
    {
        try
        {
            var proveedor = await _repo.GetByIdAsync(id);
            return proveedor is null ? null : MapToDto(proveedor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<ProveedorDto> CreateAsync(CrearProveedorDto dto)
    {
        try
        {
            var proveedor = new Proveedor
            {
                Nombre = dto.Nombre,
                Contacto = dto.Contacto,
                Telefono = dto.Telefono,
                Direccion = dto.Direccion
            };
            await _repo.AddAsync(proveedor);
            await _repo.SaveChangesAsync();
            return MapToDto(proveedor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<ProveedorDto?> UpdateAsync(int id, ActualizarProveedorDto dto)
    {
        try
        {
            var proveedor = await _repo.GetByIdAsync(id);
            if (proveedor is null) return null;

            proveedor.Nombre = dto.Nombre;
            proveedor.Contacto = dto.Contacto;
            proveedor.Telefono = dto.Telefono;
            proveedor.Direccion = dto.Direccion;
            _repo.Update(proveedor);
            await _repo.SaveChangesAsync();
            return MapToDto(proveedor);
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
            var proveedor = await _repo.GetByIdAsync(id);
            if (proveedor is null) return false;

            proveedor.Activo = false;
            _repo.Update(proveedor);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static ProveedorDto MapToDto(Proveedor p) => new ProveedorDto
    {
        Id = p.Id,
        Nombre = p.Nombre,
        Contacto = p.Contacto,
        Telefono = p.Telefono,
        Direccion = p.Direccion,
        Activo = p.Activo
    };
}
