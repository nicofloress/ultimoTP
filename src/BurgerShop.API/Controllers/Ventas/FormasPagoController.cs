using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/formaspago")]
[Authorize(Roles = "Administrador")]
public class FormasPagoController : ControllerBase
{
    private readonly IFormaPagoService _service;

    public FormasPagoController(IFormaPagoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FormaPagoDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("activas")]
    public async Task<ActionResult<IEnumerable<FormaPagoDto>>> GetActivas()
        => Ok(await _service.GetActivasAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<FormaPagoDto>> GetById(int id)
    {
        var forma = await _service.GetByIdAsync(id);
        return forma is null ? NotFound() : Ok(forma);
    }

    [HttpPost]
    public async Task<ActionResult<FormaPagoDto>> Create(CrearFormaPagoDto dto)
    {
        var forma = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = forma.Id }, forma);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FormaPagoDto>> Update(int id, ActualizarFormaPagoDto dto)
    {
        var forma = await _service.UpdateAsync(id, dto);
        return forma is null ? NotFound() : Ok(forma);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
