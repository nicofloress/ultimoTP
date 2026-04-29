using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromocionesController : ControllerBase
{
    private readonly IPromocionService _service;
    private readonly IPromocionEvaluatorService _evaluator;

    public PromocionesController(IPromocionService service, IPromocionEvaluatorService evaluator)
    {
        _service = service;
        _evaluator = evaluator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromocionDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpPost("evaluar")]
    public async Task<ActionResult<EvaluarPromocionesResultDto>> Evaluar(EvaluarPromocionesContextDto ctx)
    {
        if (ctx.LocalId <= 0) return BadRequest("localId es requerido.");
        var resultado = await _evaluator.EvaluarAsync(ctx);
        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PromocionDto>> GetById(int id)
    {
        var promo = await _service.GetByIdAsync(id);
        return promo is null ? NotFound() : Ok(promo);
    }

    [HttpGet("vigentes")]
    public async Task<ActionResult<IEnumerable<PromocionDto>>> GetVigentes([FromQuery] int localId)
    {
        if (localId <= 0)
            return BadRequest("localId es requerido.");

        return Ok(await _service.GetVigentesParaLocalAsync(localId));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<ActionResult<PromocionDto>> Create(CrearPromocionDto dto)
    {
        var promo = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = promo.Id }, promo);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<ActionResult<PromocionDto>> Update(int id, ActualizarPromocionDto dto)
    {
        var promo = await _service.UpdateAsync(id, dto);
        return promo is null ? NotFound() : Ok(promo);
    }

    [HttpPut("{id}/desactivar")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var result = await _service.DesactivarAsync(id);
        return result ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
