using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/tiposCliente")]
[Authorize(Roles = "Administrador")]
public class TiposClienteController : ControllerBase
{
    private readonly ITipoClienteService _service;

    public TiposClienteController(ITipoClienteService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TipoClienteDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<TipoClienteDto>> GetById(int id)
    {
        var tipo = await _service.GetByIdAsync(id);
        return tipo is null ? NotFound() : Ok(tipo);
    }

    [HttpPost]
    public async Task<ActionResult<TipoClienteDto>> Create(CrearTipoClienteDto dto)
    {
        var tipo = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = tipo.Id }, tipo);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TipoClienteDto>> Update(int id, ActualizarTipoClienteDto dto)
    {
        var tipo = await _service.UpdateAsync(id, dto);
        return tipo is null ? NotFound() : Ok(tipo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
