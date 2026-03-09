using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CombosController : ControllerBase
{
    private readonly IComboService _service;

    public CombosController(IComboService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComboDto>>> GetAll()
        => Ok(await _service.GetActivosAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<ComboDto>> GetById(int id)
    {
        var combo = await _service.GetByIdAsync(id);
        return combo is null ? NotFound() : Ok(combo);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ComboDto>> Create(CrearComboDto dto)
    {
        var combo = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = combo.Id }, combo);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ComboDto>> Update(int id, ActualizarComboDto dto)
    {
        var combo = await _service.UpdateAsync(id, dto);
        return combo is null ? NotFound() : Ok(combo);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
