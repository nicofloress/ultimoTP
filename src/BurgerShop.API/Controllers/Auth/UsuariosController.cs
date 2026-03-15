using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _service;

    public UsuariosController(IUsuarioService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioListDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<UsuarioListDto>> GetById(int id)
    {
        var usuario = await _service.GetByIdAsync(id);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioListDto>> Create(CrearUsuarioDto dto)
    {
        var usuario = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UsuarioListDto>> Update(int id, ActualizarUsuarioDto dto)
    {
        var usuario = await _service.UpdateAsync(id, dto);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DesactivarAsync(id);
        return result ? NoContent() : NotFound();
    }
}
