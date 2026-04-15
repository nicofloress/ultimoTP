using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class CategoriaService : ICategoriaService
{
    private readonly IRepository<Categoria> _repo;
    private readonly ILogger<CategoriaService> _logger;

    public CategoriaService(IRepository<Categoria> repo, ILogger<CategoriaService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<CategoriaDto>> GetAllAsync()
    {
        try
        {
            var categorias = await _repo.GetAllAsync();
            return categorias.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<CategoriaDto?> GetByIdAsync(int id)
    {
        try
        {
            var c = await _repo.GetByIdAsync(id);
            return c is null ? null : ToDto(c);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<CategoriaDto> CreateAsync(CrearCategoriaDto dto)
    {
        try
        {
            var categoria = new Categoria
            {
                Nombre = dto.Nombre,
                CategoriaPadreId = dto.CategoriaPadreId,
                TipoMegaCategoria = dto.TipoMegaCategoria.HasValue
                    ? (TipoMegaCategoria)dto.TipoMegaCategoria.Value
                    : TipoMegaCategoria.Otro
            };
            await _repo.AddAsync(categoria);
            await _repo.SaveChangesAsync();
            return ToDto(categoria);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<CategoriaDto?> UpdateAsync(int id, ActualizarCategoriaDto dto)
    {
        try
        {
            var categoria = await _repo.GetByIdAsync(id);
            if (categoria is null) return null;

            categoria.Nombre = dto.Nombre;
            categoria.Activa = dto.Activa;
            categoria.CategoriaPadreId = dto.CategoriaPadreId;
            if (dto.TipoMegaCategoria.HasValue)
                categoria.TipoMegaCategoria = (TipoMegaCategoria)dto.TipoMegaCategoria.Value;
            _repo.Update(categoria);
            await _repo.SaveChangesAsync();
            return ToDto(categoria);
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
            var categoria = await _repo.GetByIdAsync(id);
            if (categoria is null) return false;

            categoria.Activa = false;
            _repo.Update(categoria);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static CategoriaDto ToDto(Categoria c)
        => new(c.Id, c.Nombre, c.Activa, c.CategoriaPadreId, c.CategoriaPadre?.Nombre, (int)c.TipoMegaCategoria);
}
