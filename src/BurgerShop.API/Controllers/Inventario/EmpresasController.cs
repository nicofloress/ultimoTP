using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Inventario;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class EmpresasController : ControllerBase
{
    private readonly IEmpresaService _service;

    public EmpresasController(IEmpresaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmpresaDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<EmpresaDto>> GetById(int id)
    {
        var empresa = await _service.GetByIdAsync(id);
        return empresa is null ? NotFound() : Ok(empresa);
    }

    [HttpPost]
    public async Task<ActionResult<EmpresaDto>> Create(CrearEmpresaDto dto)
    {
        var empresa = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = empresa.Id }, empresa);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EmpresaDto>> Update(int id, ActualizarEmpresaDto dto)
    {
        var empresa = await _service.UpdateAsync(id, dto);
        return empresa is null ? NotFound() : Ok(empresa);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
