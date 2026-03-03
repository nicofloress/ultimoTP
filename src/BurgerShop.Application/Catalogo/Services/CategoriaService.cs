using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Catalogo.Services;

public class CategoriaService : ICategoriaService
{
    private readonly IRepository<Categoria> _repo;

    public CategoriaService(IRepository<Categoria> repo) => _repo = repo;

    public async Task<IEnumerable<CategoriaDto>> GetAllAsync()
    {
        var categorias = await _repo.GetAllAsync();
        return categorias.Select(c => new CategoriaDto(c.Id, c.Nombre, c.Activa));
    }

    public async Task<CategoriaDto?> GetByIdAsync(int id)
    {
        var c = await _repo.GetByIdAsync(id);
        return c is null ? null : new CategoriaDto(c.Id, c.Nombre, c.Activa);
    }

    public async Task<CategoriaDto> CreateAsync(CrearCategoriaDto dto)
    {
        var categoria = new Categoria { Nombre = dto.Nombre };
        await _repo.AddAsync(categoria);
        await _repo.SaveChangesAsync();
        return new CategoriaDto(categoria.Id, categoria.Nombre, categoria.Activa);
    }

    public async Task<CategoriaDto?> UpdateAsync(int id, ActualizarCategoriaDto dto)
    {
        var categoria = await _repo.GetByIdAsync(id);
        if (categoria is null) return null;

        categoria.Nombre = dto.Nombre;
        categoria.Activa = dto.Activa;
        _repo.Update(categoria);
        await _repo.SaveChangesAsync();
        return new CategoriaDto(categoria.Id, categoria.Nombre, categoria.Activa);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var categoria = await _repo.GetByIdAsync(id);
        if (categoria is null) return false;

        categoria.Activa = false;
        _repo.Update(categoria);
        await _repo.SaveChangesAsync();
        return true;
    }
}
