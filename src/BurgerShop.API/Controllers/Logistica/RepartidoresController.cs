using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
public class RepartidoresController : ControllerBase
{
    private readonly IRepartidorService _service;

    public RepartidoresController(IRepartidorService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RepartidorDto>>> GetAll()
        => Ok(await _service.GetActivosAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<RepartidorDto>> GetById(int id)
    {
        var repartidor = await _service.GetByIdAsync(id);
        return repartidor is null ? NotFound() : Ok(repartidor);
    }

    [HttpPost]
    public async Task<ActionResult<RepartidorDto>> Create(CrearRepartidorDto dto)
    {
        var repartidor = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = repartidor.Id }, repartidor);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RepartidorDto>> Update(int id, ActualizarRepartidorDto dto)
    {
        var repartidor = await _service.UpdateAsync(id, dto);
        return repartidor is null ? NotFound() : Ok(repartidor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }

    [HttpPut("{id}/zonas")]
    public async Task<ActionResult<RepartidorDto>> AsignarZonas(int id, AsignarZonasDto dto)
    {
        var repartidor = await _service.AsignarZonasAsync(id, dto.ZonaIds);
        return repartidor is null ? NotFound() : Ok(repartidor);
    }
}
