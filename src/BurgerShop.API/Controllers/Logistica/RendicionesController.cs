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
    public async Task<ActionResult<IEnumerable<RendicionDto>>> GetAll([FromQuery] DateTime? fechaDesde, [FromQuery] DateTime? fechaHasta, [FromQuery] int? localId)
    {
        // Si no viene localId explícito, usar el del JWT
        var lid = localId ?? (int.TryParse(User.FindFirst("localId")?.Value, out var parsed) ? parsed : (int?)null);
        var rendiciones = await _service.GetAllAsync(fechaDesde, fechaHasta);
        if (lid.HasValue)
            rendiciones = rendiciones.Where(r => r.RepartidorLocalId == lid.Value);
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

    [HttpGet("estado-reparto/{repartidorId}")]
    public async Task<ActionResult<EstadoRepartoRepartidorDto>> GetEstadoReparto(int repartidorId)
    {
        var estado = await _service.GetEstadoRepartoAsync(repartidorId);
        return Ok(estado);
    }

    [HttpGet("repartidores-pendientes")]
    public async Task<ActionResult<IEnumerable<RepartidorPendienteRendicionDto>>> GetRepartidoresPendientes()
    {
        var lid = int.TryParse(User.FindFirst("localId")?.Value, out var parsed) ? parsed : (int?)null;
        var result = await _service.GetRepartidoresPendientesAsync();
        if (lid.HasValue)
            result = result.Where(r => r.RepartidorLocalId == lid.Value);
        return Ok(result);
    }
}
