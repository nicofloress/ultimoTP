using BurgerShop.Application.Sistema.DTOs;
using BurgerShop.Application.Sistema.Interfaces;
using BurgerShop.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Sistema;

[ApiController]
[Route("api/logs")]
[Authorize(Roles = "Administrador")]
public class LogsController : ControllerBase
{
    private readonly ILogService _service;

    public LogsController(ILogService service) => _service = service;

    /// <summary>
    /// Devuelve el listado paginado de logs con filtros opcionales.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<LogEntryPagedResult>> GetPaginated(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] LogNivel? nivel,
        [FromQuery] string? busqueda,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 50;

        var resultado = await _service.GetPaginatedAsync(desde, hasta, nivel, busqueda, page, pageSize);
        return Ok(resultado);
    }

    /// <summary>
    /// Elimina logs más antiguos que el número de días especificado.
    /// </summary>
    [HttpDelete("limpiar")]
    public async Task<IActionResult> Limpiar([FromQuery] int dias = 30)
    {
        if (dias < 1)
            return BadRequest(new { message = "El parámetro 'dias' debe ser mayor a 0." });

        var eliminados = await _service.LimpiarAntiguosAsync(dias);
        return Ok(new { eliminados, mensaje = $"Se eliminaron {eliminados} registros anteriores a los últimos {dias} días." });
    }
}
