using System.Security.Claims;
using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Application.Notificaciones;
using BurgerShop.Domain.Interfaces.Logistica;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MensajesController : ControllerBase
{
    private readonly IMensajeService _service;
    private readonly INotificacionService _notificaciones;
    private readonly IRepartidorRepository _repartidorRepo;

    public MensajesController(
        IMensajeService service,
        INotificacionService notificaciones,
        IRepartidorRepository repartidorRepo)
    {
        _service = service;
        _notificaciones = notificaciones;
        _repartidorRepo = repartidorRepo;
    }

    [HttpGet("repartidor/{repartidorId}")]
    public async Task<ActionResult<IEnumerable<MensajeDto>>> GetByRepartidor(int repartidorId)
        => Ok(await _service.GetByRepartidorAsync(repartidorId));

    [HttpPost("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<MensajeDto>> EnviarComoAdmin(CrearMensajeDto dto)
    {
        var mensaje = await _service.EnviarMensajeAsync(dto, esDeAdmin: true);
        await _notificaciones.NotificarMensajeParaRepartidorAsync(dto.RepartidorId, dto.Texto);
        return Ok(mensaje);
    }

    [HttpPost("repartidor")]
    [Authorize(Roles = "Repartidor")]
    public async Task<ActionResult<MensajeDto>> EnviarComoRepartidor([FromBody] EnviarMensajeRepartidorDto dto)
    {
        var repartidorIdClaim = User.FindFirstValue("repartidorId");
        if (repartidorIdClaim is null || !int.TryParse(repartidorIdClaim, out var repartidorId))
            return Unauthorized(new { message = "No se encontro el repartidorId en el token" });

        var crearDto = new CrearMensajeDto(repartidorId, dto.Texto);
        var mensaje = await _service.EnviarMensajeAsync(crearDto, esDeAdmin: false);

        var repartidor = await _repartidorRepo.GetByIdAsync(repartidorId);
        await _notificaciones.NotificarMensajeParaAdminAsync(repartidorId, repartidor?.Nombre ?? "Repartidor", dto.Texto);
        return Ok(mensaje);
    }

    [HttpPut("leidos/{repartidorId}")]
    public async Task<IActionResult> MarcarLeidos(int repartidorId, [FromQuery] bool esDeAdmin = true)
    {
        await _service.MarcarLeidosAsync(repartidorId, esDeAdmin);
        return NoContent();
    }

    [HttpGet("no-leidos/{repartidorId}")]
    public async Task<ActionResult<int>> GetNoLeidos(int repartidorId, [FromQuery] bool esDeAdmin = true)
    {
        var count = await _service.GetNoLeidosCountAsync(repartidorId, esDeAdmin);
        return Ok(count);
    }
}

public record EnviarMensajeRepartidorDto(string Texto);
