using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class ProveedoresController : ControllerBase
{
    private readonly IProveedorService _service;

    public ProveedoresController(IProveedorService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProveedorDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<ProveedorDto>> GetById(int id)
    {
        var proveedor = await _service.GetByIdAsync(id);
        return proveedor is null ? NotFound() : Ok(proveedor);
    }

    [HttpPost]
    public async Task<ActionResult<ProveedorDto>> Create(CrearProveedorDto dto)
    {
        var proveedor = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = proveedor.Id }, proveedor);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProveedorDto>> Update(int id, ActualizarProveedorDto dto)
    {
        var proveedor = await _service.UpdateAsync(id, dto);
        return proveedor is null ? NotFound() : Ok(proveedor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
