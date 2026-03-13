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
        return categorias.Select(ToDto);
    }

    public async Task<CategoriaDto?> GetByIdAsync(int id)
    {
        var c = await _repo.GetByIdAsync(id);
        return c is null ? null : ToDto(c);
    }

    public async Task<CategoriaDto> CreateAsync(CrearCategoriaDto dto)
    {
        var categoria = new Categoria
        {
            Nombre = dto.Nombre,
            CategoriaPadreId = dto.CategoriaPadreId
        };
        await _repo.AddAsync(categoria);
        await _repo.SaveChangesAsync();
        return ToDto(categoria);
    }

    public async Task<CategoriaDto?> UpdateAsync(int id, ActualizarCategoriaDto dto)
    {
        var categoria = await _repo.GetByIdAsync(id);
        if (categoria is null) return null;

        categoria.Nombre = dto.Nombre;
        categoria.Activa = dto.Activa;
        categoria.CategoriaPadreId = dto.CategoriaPadreId;
        _repo.Update(categoria);
        await _repo.SaveChangesAsync();
        return ToDto(categoria);
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

    private static CategoriaDto ToDto(Categoria c)
        => new(c.Id, c.Nombre, c.Activa, c.CategoriaPadreId, c.CategoriaPadre?.Nombre);
}
