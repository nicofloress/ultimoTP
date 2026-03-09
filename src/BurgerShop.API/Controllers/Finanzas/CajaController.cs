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

    /// <summary>
    /// Retorna la caja actualmente abierta. Devuelve 204 si no hay ninguna abierta.
    /// </summary>
    [HttpGet("abierta")]
    public async Task<ActionResult<CierreCajaDto>> GetCajaAbierta()
    {
        var caja = await _service.GetCajaAbiertaAsync();
        return caja is null ? NoContent() : Ok(caja);
    }

    /// <summary>
    /// Abre una nueva caja diaria.
    /// </summary>
    [HttpPost("abrir")]
    public async Task<ActionResult<CierreCajaDto>> AbrirCaja(AbrirCajaDto dto)
    {
        try
        {
            var caja = await _service.AbrirCajaAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = caja.Id }, caja);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    /// <summary>
    /// Cierra la caja indicada, calculando los totales por forma de pago.
    /// </summary>
    [HttpPut("{id}/cerrar")]
    public async Task<ActionResult<CierreCajaDto>> CerrarCaja(int id, CerrarCajaDto dto)
    {
        var caja = await _service.CerrarCajaAsync(id, dto);
        return caja is null ? NotFound() : Ok(caja);
    }

    /// <summary>
    /// Retorna el historial de los últimos cierres de caja.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CierreCajaDto>>> GetHistorial()
    {
        var historial = await _service.GetHistorialAsync();
        return Ok(historial);
    }

    /// <summary>
    /// Retorna el detalle de un cierre de caja por id.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CierreCajaDto>> GetById(int id)
    {
        var caja = await _service.GetByIdAsync(id);
        return caja is null ? NotFound() : Ok(caja);
    }
}
