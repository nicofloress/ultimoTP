using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Catalogo;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class HistorialPreciosController : ControllerBase
{
    private readonly IHistorialPrecioService _service;

    public HistorialPreciosController(IHistorialPrecioService service) => _service = service;

    [HttpGet("{tipoEntidad}/{entidadId}")]
    public async Task<ActionResult<IEnumerable<HistorialPrecioDto>>> GetByEntidad(string tipoEntidad, int entidadId)
        => Ok(await _service.GetByEntidadAsync(tipoEntidad, entidadId));

    [HttpGet("recientes")]
    public async Task<ActionResult<IEnumerable<HistorialPrecioDto>>> GetRecientes([FromQuery] int cantidad = 50)
        => Ok(await _service.GetRecientesAsync(cantidad));
}
