using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class MarcasController : ControllerBase
{
    private readonly IMarcaService _service;

    public MarcasController(IMarcaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MarcaDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("activas")]
    public async Task<ActionResult<IEnumerable<MarcaDto>>> GetActivas()
        => Ok(await _service.GetActivasAsync());

    [HttpPost]
    public async Task<ActionResult<MarcaDto>> Create(CrearMarcaDto dto)
    {
        var marca = await _service.CreateAsync(dto);
        return Ok(marca);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MarcaDto>> Update(int id, ActualizarMarcaDto dto)
    {
        var marca = await _service.UpdateAsync(id, dto);
        return marca is null ? NotFound() : Ok(marca);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
