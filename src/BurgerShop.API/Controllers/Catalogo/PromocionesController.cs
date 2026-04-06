using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class PromocionesController : ControllerBase
{
    private readonly IPromocionService _service;

    public PromocionesController(IPromocionService service) => _service = service;

    [HttpGet]
    [Authorize] // Todos los roles autenticados pueden consultar promos
    public async Task<ActionResult<IEnumerable<PromocionDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<PromocionDto>> GetById(int id)
    {
        var promo = await _service.GetByIdAsync(id);
        return promo is null ? NotFound() : Ok(promo);
    }

    /// <summary>
    /// Retorna las promociones activas y vigentes para el local indicado.
    /// Accessible para todos los roles autenticados (se usa desde el POS).
    /// </summary>
    [HttpGet("vigentes")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<PromocionDto>>> GetVigentes([FromQuery] int localId)
    {
        if (localId <= 0)
            return BadRequest("localId es requerido.");

        return Ok(await _service.GetVigentesParaLocalAsync(localId));
    }

    [HttpPost]
    public async Task<ActionResult<PromocionDto>> Create(CrearPromocionDto dto)
    {
        var promo = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = promo.Id }, promo);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PromocionDto>> Update(int id, ActualizarPromocionDto dto)
    {
        var promo = await _service.UpdateAsync(id, dto);
        return promo is null ? NotFound() : Ok(promo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
