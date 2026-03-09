using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _service;

    public ProductosController(IProductoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> GetAll(
        [FromQuery] int? categoriaId,
        [FromQuery] string? buscar,
        [FromQuery] int? listaPrecioId)
    {
        if (!string.IsNullOrWhiteSpace(buscar))
            return Ok(await _service.BuscarAsync(buscar, listaPrecioId));
        if (categoriaId.HasValue)
            return Ok(await _service.GetByCategoriaAsync(categoriaId.Value, listaPrecioId));
        return Ok(await _service.GetActivosAsync(listaPrecioId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductoDto>> GetById(int id)
    {
        var producto = await _service.GetByIdAsync(id);
        return producto is null ? NotFound() : Ok(producto);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ProductoDto>> Create(CrearProductoDto dto)
    {
        var producto = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = producto.Id }, producto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ProductoDto>> Update(int id, ActualizarProductoDto dto)
    {
        var producto = await _service.UpdateAsync(id, dto);
        return producto is null ? NotFound() : Ok(producto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
