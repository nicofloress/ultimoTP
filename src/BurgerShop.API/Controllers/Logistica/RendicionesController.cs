using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/rendiciones")]
[Authorize]
public class RendicionesController : ControllerBase
{
    private readonly IRendicionService _service;

    public RendicionesController(IRendicionService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<RendicionDto>> Crear(CrearRendicionDto dto)
    {
        try
        {
            var rendicion = await _service.CrearRendicionAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = rendicion.Id }, rendicion);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RendicionDto>>> GetAll([FromQuery] DateTime? fecha)
    {
        var rendiciones = await _service.GetAllAsync(fecha);
        return Ok(rendiciones);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RendicionDto>> GetById(int id)
    {
        var rendicion = await _service.GetByIdAsync(id);
        return rendicion is null ? NotFound() : Ok(rendicion);
    }

    [HttpGet("repartidor/{id}")]
    public async Task<ActionResult<IEnumerable<RendicionDto>>> GetByRepartidor(int id)
    {
        var rendiciones = await _service.GetByRepartidorAsync(id);
        return Ok(rendiciones);
    }

    [HttpPut("{id}/aprobar")]
    public async Task<ActionResult<RendicionDto>> Aprobar(int id, AprobarRendicionDto dto)
    {
        var rendicion = await _service.AprobarAsync(id, dto);
        return rendicion is null ? NotFound() : Ok(rendicion);
    }
}
