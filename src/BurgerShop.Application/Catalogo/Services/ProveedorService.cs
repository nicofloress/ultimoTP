using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Catalogo.Services;

public class ProveedorService : IProveedorService
{
    private readonly IRepository<Proveedor> _repo;

    public ProveedorService(IRepository<Proveedor> repo) => _repo = repo;

    public async Task<IEnumerable<ProveedorDto>> GetAllAsync()
    {
        var proveedores = await _repo.GetAllAsync();
        return proveedores.Select(MapToDto);
    }

    public async Task<ProveedorDto?> GetByIdAsync(int id)
    {
        var proveedor = await _repo.GetByIdAsync(id);
        return proveedor is null ? null : MapToDto(proveedor);
    }

    public async Task<ProveedorDto> CreateAsync(CrearProveedorDto dto)
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

    public async Task<ProveedorDto?> UpdateAsync(int id, ActualizarProveedorDto dto)
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

    public async Task<bool> DeleteAsync(int id)
    {
        var proveedor = await _repo.GetByIdAsync(id);
        if (proveedor is null) return false;

        proveedor.Activo = false;
        _repo.Update(proveedor);
        await _repo.SaveChangesAsync();
        return true;
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
