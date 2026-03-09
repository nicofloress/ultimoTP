using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/listasprecios")]
[Authorize]
public class ListasPrecioController : ControllerBase
{
    private readonly IListaPrecioService _service;

    public ListasPrecioController(IListaPrecioService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ListaPrecioDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ListaPrecioDto>> GetById(int id)
    {
        var lista = await _service.GetByIdAsync(id);
        return lista is null ? NotFound() : Ok(lista);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ListaPrecioDto>> Create(CrearListaPrecioDto dto)
    {
        var lista = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = lista.Id }, lista);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ListaPrecioDto>> Update(int id, ActualizarListaPrecioDto dto)
    {
        var lista = await _service.UpdateAsync(id, dto);
        return lista is null ? NotFound() : Ok(lista);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }

    [HttpPost("{id}/detalles")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ListaPrecioDetalleDto>> UpsertDetalle(int id, UpsertDetalleDto dto)
    {
        var detalle = await _service.UpsertDetalleAsync(id, dto);
        return detalle is null ? NotFound() : Ok(detalle);
    }

    [HttpDelete("{id}/detalles/{productoId}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> DeleteDetalle(int id, int productoId)
    {
        var result = await _service.DeleteDetalleAsync(id, productoId);
        return result ? NoContent() : NotFound();
    }
}
