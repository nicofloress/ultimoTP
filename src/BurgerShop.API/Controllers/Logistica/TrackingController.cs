using System.Security.Claims;
using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/tracking")]
[Authorize]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _service;

    public TrackingController(ITrackingService service) => _service = service;

    [HttpPost("ubicacion")]
    [Authorize(Roles = "Repartidor")]
    public async Task<ActionResult<UbicacionDto>> ActualizarUbicacion([FromBody] ActualizarUbicacionDto dto)
    {
        var repartidorIdClaim = User.FindFirstValue("repartidorId");
        if (repartidorIdClaim is null || !int.TryParse(repartidorIdClaim, out var repartidorId))
            return Unauthorized(new { message = "No se encontro el repartidorId en el token" });

        var ubicacion = await _service.ActualizarUbicacionAsync(repartidorId, dto);
        return Ok(ubicacion);
    }

    [HttpGet("activos")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<IEnumerable<UbicacionDto>>> GetActivos()
        => Ok(await _service.GetActivosAsync());

    [HttpGet("repartidor/{id}")]
    public async Task<ActionResult<UbicacionDto>> GetByRepartidor(int id)
    {
        var ubicacion = await _service.GetByRepartidorIdAsync(id);
        if (ubicacion is null)
            return NotFound(new { message = "No se encontro ubicacion para este repartidor" });
        return Ok(ubicacion);
    }

    [HttpPost("desactivar")]
    [Authorize(Roles = "Repartidor")]
    public async Task<IActionResult> Desactivar()
    {
        var repartidorIdClaim = User.FindFirstValue("repartidorId");
        if (repartidorIdClaim is null || !int.TryParse(repartidorIdClaim, out var repartidorId))
            return Unauthorized(new { message = "No se encontro el repartidorId en el token" });

        await _service.DesactivarAsync(repartidorId);
        return NoContent();
    }
}
