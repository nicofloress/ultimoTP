using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Finanzas;

[ApiController]
[Route("api/caja")]
[Authorize]
public class CajaController : ControllerBase
{
    private readonly ICierreCajaService _service;

    public CajaController(ICierreCajaService service) => _service = service;

    private int? GetLocalIdFromClaims()
    {
        var claim = User.FindFirst("localId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("abierta")]
    public async Task<ActionResult<CierreCajaDto>> GetCajaAbierta([FromQuery] int? localId = null)
    {
        var lid = localId ?? GetLocalIdFromClaims();
        var caja = await _service.GetCajaAbiertaAsync(lid);
        return caja is null ? NoContent() : Ok(caja);
    }

    [HttpPost("abrir")]
    public async Task<ActionResult<CierreCajaDto>> AbrirCaja(AbrirCajaDto dto)
    {
        try
        {
            // Si no viene localId en el DTO, usar el del JWT
            var dtoConLocal = dto.LocalId.HasValue ? dto : dto with { LocalId = GetLocalIdFromClaims() };
            var caja = await _service.AbrirCajaAsync(dtoConLocal);
            return CreatedAtAction(nameof(GetById), new { id = caja.Id }, caja);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id}/cerrar")]
    public async Task<ActionResult<CierreCajaDto>> CerrarCaja(int id, CerrarCajaDto dto)
    {
        var caja = await _service.CerrarCajaAsync(id, dto);
        return caja is null ? NotFound() : Ok(caja);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CierreCajaDto>>> GetHistorial([FromQuery] int? localId = null)
    {
        var lid = localId ?? GetLocalIdFromClaims();
        var historial = await _service.GetHistorialAsync(lid);
        return Ok(historial);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CierreCajaDto>> GetById(int id)
    {
        var caja = await _service.GetByIdAsync(id);
        return caja is null ? NotFound() : Ok(caja);
    }
}
