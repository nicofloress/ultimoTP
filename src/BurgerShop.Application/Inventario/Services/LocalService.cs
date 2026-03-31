using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Inventario.Services;

public class LocalService : ILocalService
{
    private readonly IRepository<Local> _repo;

    public LocalService(IRepository<Local> repo) => _repo = repo;

    public async Task<IEnumerable<LocalDto>> GetAllAsync()
    {
        var locales = await _repo.GetAllAsync();
        return locales.Select(ToDto);
    }

    public async Task<LocalDto?> GetByIdAsync(int id)
    {
        var local = await _repo.GetByIdAsync(id);
        return local is null ? null : ToDto(local);
    }

    public async Task<LocalDto> CreateAsync(CrearLocalDto dto)
    {
        var local = new Local
        {
            Nombre = dto.Nombre,
            Direccion = dto.Direccion,
            EmpresaId = dto.EmpresaId,
            EsPuntoVenta = dto.EsPuntoVenta
        };
        await _repo.AddAsync(local);
        await _repo.SaveChangesAsync();
        return ToDto(local);
    }

    public async Task<LocalDto> UpdateAsync(int id, ActualizarLocalDto dto)
    {
        var local = await _repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Local {id} no encontrado.");

        local.Nombre = dto.Nombre;
        local.Direccion = dto.Direccion;
        local.EmpresaId = dto.EmpresaId;
        local.EsPuntoVenta = dto.EsPuntoVenta;
        local.Activo = dto.Activo;

        _repo.Update(local);
        await _repo.SaveChangesAsync();
        return ToDto(local);
    }

    public async Task DeleteAsync(int id)
    {
        var local = await _repo.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Local {id} no encontrado.");

        local.Activo = false;
        _repo.Update(local);
        await _repo.SaveChangesAsync();
    }

    private static LocalDto ToDto(Local l) =>
        new(l.Id, l.Nombre, l.Direccion, l.EmpresaId, l.Empresa?.NombreFantasia ?? l.Empresa?.RazonSocial, l.EsPuntoVenta, l.Activo);
}
