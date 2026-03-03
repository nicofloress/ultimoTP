using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
public class ZonasController : ControllerBase
{
    private readonly IZonaService _service;

    public ZonasController(IZonaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ZonaDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<ZonaDto>> GetById(int id)
    {
        var zona = await _service.GetByIdAsync(id);
        return zona is null ? NotFound() : Ok(zona);
    }

    [HttpPost]
    public async Task<ActionResult<ZonaDto>> Create(CrearZonaDto dto)
    {
        var zona = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = zona.Id }, zona);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ZonaDto>> Update(int id, ActualizarZonaDto dto)
    {
        var zona = await _service.UpdateAsync(id, dto);
        return zona is null ? NotFound() : Ok(zona);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
