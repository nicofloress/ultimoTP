using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Ventas.Services;

public class FormaPagoService : IFormaPagoService
{
    private readonly IRepository<FormaPago> _repo;

    public FormaPagoService(IRepository<FormaPago> repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<FormaPagoDto>> GetAllAsync()
    {
        var formas = await _repo.GetAllAsync();
        return formas.Select(ToDto);
    }

    public async Task<IEnumerable<FormaPagoDto>> GetActivasAsync()
    {
        var formas = await _repo.FindAsync(f => f.Activa);
        return formas.Select(ToDto);
    }

    public async Task<FormaPagoDto?> GetByIdAsync(int id)
    {
        var forma = await _repo.GetByIdAsync(id);
        return forma is null ? null : ToDto(forma);
    }

    public async Task<FormaPagoDto> CreateAsync(CrearFormaPagoDto dto)
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

    public async Task<FormaPagoDto?> UpdateAsync(int id, ActualizarFormaPagoDto dto)
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

    public async Task<bool> DeleteAsync(int id)
    {
        var forma = await _repo.GetByIdAsync(id);
        if (forma is null) return false;

        _repo.Remove(forma);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static FormaPagoDto ToDto(FormaPago f) =>
        new(f.Id, f.Nombre, f.PorcentajeRecargo, f.Activa);
}
