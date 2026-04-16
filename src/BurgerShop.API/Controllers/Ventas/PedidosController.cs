using BurgerShop.Application.Notificaciones;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Enums;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/ventas")]
[Authorize]
public class VentasController : ControllerBase
{
    private readonly IVentaService _service;
    private readonly INotificacionService _notificaciones;

    public VentasController(IVentaService service, INotificacionService notificaciones)
    {
        _service = service;
        _notificaciones = notificaciones;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Administrador,Local")]
    public async Task<ActionResult<VentaDto>> Create(CrearVentaDto dto)
    {
        int? usuarioId = null;
        if (int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid))
            usuarioId = uid;

        try
        {
            var venta = await _service.CreateAsync(dto, usuarioId);
            await _notificaciones.NotificarNuevoPedidoAsync(venta.Id, venta.NumeroTicket, venta.Tipo.ToString());
            return CreatedAtAction(nameof(GetById), new { id = venta.Id }, venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetAll(
        [FromQuery] DateTime? fecha, [FromQuery] DateTime? fechaHasta, [FromQuery] EstadoVenta? estado, [FromQuery] int? localId)
    {
        // Si no viene localId explícito, usar el del JWT
        var lid = localId ?? (int.TryParse(User.FindFirst("localId")?.Value, out var parsed) ? parsed : (int?)null);

        IEnumerable<VentaDto> ventas;
        if (fechaHasta.HasValue)
            ventas = await _service.GetByRangoFechasAsync(fecha ?? DateTime.Today, fechaHasta.Value);
        else
            ventas = await _service.GetByFechaAsync(fecha ?? DateTime.Today);

        if (lid.HasValue)
            ventas = ventas.Where(v => v.LocalId == lid.Value);
        if (estado.HasValue)
            ventas = ventas.Where(v => v.Estado == estado.Value);
        return Ok(ventas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VentaDto>> GetById(int id)
    {
        var venta = await _service.GetByIdAsync(id);
        return venta is null ? NotFound() : Ok(venta);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VentaDto>> Update(int id, [FromBody] ActualizarVentaDto dto)
    {
        try
        {
            var venta = await _service.UpdateAsync(id, dto);
            if (venta == null) return NotFound();
            return Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/estado")]
    public async Task<ActionResult<VentaDto>> CambiarEstado(int id, CambiarEstadoDto dto)
    {
        var venta = await _service.CambiarEstadoAsync(id, dto.NuevoEstado);
        if (venta is null) return NotFound();
        await _notificaciones.NotificarCambioEstadoAsync(venta.Id, venta.NumeroTicket, dto.NuevoEstado.ToString());
        return Ok(venta);
    }

    [HttpPut("{id}/cancelar")]
    public async Task<ActionResult<VentaDto>> Cancelar(int id, [FromBody] CancelarVentaDto dto)
    {
        try
        {
            var venta = await _service.CancelarAsync(id, dto.Motivo);
            if (venta is null) return NotFound();
            await _notificaciones.NotificarPedidoCanceladoAsync(venta.Id, venta.NumeroTicket);
            return Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/ticket")]
    public async Task<ActionResult<TicketDto>> GetTicket(int id)
    {
        var ticket = await _service.GetTicketAsync(id);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPut("preparar-todos")]
    public async Task<ActionResult> PrepararTodos()
    {
        var count = await _service.PrepararTodosAsync();
        return Ok(new { actualizados = count });
    }

    [HttpGet("deposito")]
    [Authorize(Roles = "Deposito,SuperAdmin")]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetDeposito()
    {
        int? localId = null;
        var localIdClaim = User.FindFirstValue("localId");
        if (int.TryParse(localIdClaim, out var parsed))
            localId = parsed;
        return Ok(await _service.GetVentasDepositoAsync(localId));
    }

    [HttpPut("{id}/vencer-deposito")]
    [Authorize(Roles = "Deposito,SuperAdmin")]
    public async Task<ActionResult> VencerDeposito(int id)
    {
        await _service.MarcarVencidoDepositoAsync(id);
        return Ok();
    }

    [HttpPost("{id}/enviar-deposito")]
    [Authorize(Roles = "SuperAdmin,Administrador,Local")]
    public async Task<ActionResult> EnviarADeposito(int id)
    {
        try
        {
            await _service.EnviarADepositoAsync(id);
            return Ok(new { message = "Venta enviada a depósito correctamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<VentaStatsDto>> GetStats([FromQuery] DateTime? fecha, [FromQuery] int? localId = null, [FromQuery] int? tipo = null)
    {
        var stats = await _service.GetStatsAsync(fecha ?? DateTime.Today, localId, tipo);
        return Ok(stats);
    }

    [HttpPut("{id}/asignar-caja")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<ActionResult<VentaDto>> AsignarCaja(int id)
    {
        try
        {
            var venta = await _service.AsignarCajaActualAsync(id);
            return venta is null ? NotFound() : Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
