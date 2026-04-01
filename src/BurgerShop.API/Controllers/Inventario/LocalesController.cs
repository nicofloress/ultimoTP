using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Inventario;

[ApiController]
[Route("api/locales")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class LocalesController : ControllerBase
{
    private readonly ILocalService _service;

    public LocalesController(ILocalService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocalDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<LocalDto>> GetById(int id)
    {
        var local = await _service.GetByIdAsync(id);
        return local is null ? NotFound() : Ok(local);
    }

    [HttpPost]
    public async Task<ActionResult<LocalDto>> Create(CrearLocalDto dto)
    {
        var local = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = local.Id }, local);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LocalDto>> Update(int id, ActualizarLocalDto dto)
    {
        var local = await _service.UpdateAsync(id, dto);
        return local is null ? NotFound() : Ok(local);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
