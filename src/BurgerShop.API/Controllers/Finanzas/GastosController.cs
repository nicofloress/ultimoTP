using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Finanzas;

[ApiController]
[Route("api/gastos")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class GastosController : ControllerBase
{
    private readonly IGastoService _service;

    public GastosController(IGastoService service) => _service = service;

    private int? GetLocalIdFromClaims()
    {
        var claim = User.FindFirst("localId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    private int? GetUsuarioIdFromClaims()
    {
        var claim = User.FindFirst("sub")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GastoDto>>> GetAll([FromQuery] int? localId = null)
    {
        var lid = localId ?? GetLocalIdFromClaims();
        var gastos = await _service.GetAllAsync(lid);
        return Ok(gastos);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<GastoStatsDto>> GetStats([FromQuery] int? localId = null)
    {
        var lid = localId ?? GetLocalIdFromClaims();
        var stats = await _service.GetStatsAsync(lid);
        return Ok(stats);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GastoDto>> GetById(int id)
    {
        var gasto = await _service.GetByIdAsync(id);
        return gasto is null ? NotFound() : Ok(gasto);
    }

    [HttpPost]
    public async Task<ActionResult<GastoDto>> Create(CrearGastoDto dto)
    {
        var usuarioId = GetUsuarioIdFromClaims();
        var gasto = await _service.CreateAsync(dto, usuarioId);
        return CreatedAtAction(nameof(GetById), new { id = gasto.Id }, gasto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GastoDto>> Update(int id, ActualizarGastoDto dto)
    {
        var gasto = await _service.UpdateAsync(id, dto);
        return gasto is null ? NotFound() : Ok(gasto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var eliminado = await _service.DeleteAsync(id);
        return eliminado ? NoContent() : NotFound();
    }
}
