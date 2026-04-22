using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Application.Notificaciones;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Administrador,Repartidor")]
public class EntregasController : ControllerBase
{
    private readonly IVentaService _ventaService;
    private readonly IControlCamionetaService _controlCamionetaService;
    private readonly INotificacionService _notificaciones;

    public EntregasController(
        IVentaService ventaService,
        IControlCamionetaService controlCamionetaService,
        INotificacionService notificaciones)
    {
        _ventaService = ventaService;
        _controlCamionetaService = controlCamionetaService;
        _notificaciones = notificaciones;
    }

    [HttpGet("pendientes")]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetPendientes()
        => Ok(await _ventaService.GetPendientesEntregaAsync());

    [HttpPost("asignar")]
    public async Task<ActionResult<VentaDto>> Asignar(AsignarEntregaDto dto)
    {
        var venta = await _ventaService.AsignarRepartidorAsync(dto.VentaId, dto.RepartidorId);
        if (venta is null) return NotFound();
        await _notificaciones.NotificarPedidoAsignadoAsync(
            dto.RepartidorId, venta.Id, venta.NumeroTicket, venta.DireccionEntrega);
        return Ok(venta);
    }

    [HttpGet("repartidor/{id}")]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetByRepartidor(int id)
        => Ok(await _ventaService.GetEntregasRepartidorHoyAsync(id));

    [HttpPut("{ventaId}/en-camino")]
    public async Task<ActionResult<VentaDto>> MarcarEnCamino(int ventaId)
    {
        try
        {
            var venta = await _ventaService.MarcarEnCaminoAsync(ventaId);
            return venta is null ? NotFound() : Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{ventaId}/entregar")]
    public async Task<ActionResult<VentaDto>> MarcarEntregado(int ventaId, [FromBody] MarcarEntregadoDto dto)
    {
        var venta = await _ventaService.MarcarEntregadoAsync(ventaId, dto);
        if (venta is null) return NotFound();
        await _notificaciones.NotificarPedidoEntregadoAsync(venta.Id, venta.NumeroTicket, venta.RepartidorNombre, venta.LocalId);
        return Ok(venta);
    }

    [HttpPut("{ventaId}/no-entregado")]
    public async Task<ActionResult<VentaDto>> MarcarNoEntregado(int ventaId, [FromBody] CancelarVentaDto dto)
    {
        try
        {
            var venta = await _ventaService.MarcarNoEntregadoAsync(ventaId, dto.Motivo);
            return venta is null ? NotFound() : Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{ventaId}/reabrir")]
    public async Task<ActionResult<VentaDto>> ReabrirEntrega(int ventaId)
    {
        try
        {
            var venta = await _ventaService.ReabrirEntregaAsync(ventaId);
            return venta is null ? NotFound() : Ok(venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("por-zona")]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetPorZona()
    {
        var ventas = await _ventaService.GetListosParaRepartoHoyAsync();
        var localIdClaim = User.FindFirst("localId")?.Value;
        if (int.TryParse(localIdClaim, out var localId))
            ventas = ventas.Where(v => v.LocalId == localId);
        return Ok(ventas);
    }

    [HttpPost("empezar-reparto")]
    public async Task<ActionResult<IEnumerable<VentaDto>>> EmpezarReparto(EmpezarRepartoDto dto)
    {
        try
        {
            var ventas = (await _ventaService.EmpezarRepartoAsync(dto)).ToList();

            // Notificar a cada repartidor cuántos pedidos le tocaron
            var asignaciones = ventas
                .Where(v => v.RepartidorId.HasValue)
                .GroupBy(v => v.RepartidorId!.Value)
                .Select(g => (g.Key, g.Count()));
            await _notificaciones.NotificarRepartoIniciadoAsync(asignaciones);

            return Ok(ventas);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("repartos-abandonados")]
    [Authorize(Roles = "SuperAdmin,Administrador,Local")]
    public async Task<ActionResult<IEnumerable<RepartoAbandonadoDto>>> GetRepartosAbandonados()
    {
        int? localId = null;
        var rol = User.FindFirstValue(ClaimTypes.Role);
        if (rol != "SuperAdmin")
        {
            var localIdClaim = User.FindFirstValue("localId");
            if (int.TryParse(localIdClaim, out var parsed))
                localId = parsed;
        }
        return Ok(await _ventaService.GetRepartosAbandonadosAsync(localId));
    }

    [HttpPost("finalizar-reparto/{id}")]
    [Authorize(Roles = "SuperAdmin,Administrador,Local")]
    public async Task<IActionResult> FinalizarRepartoPorId(int id)
    {
        try
        {
            await _ventaService.FinalizarRepartoAbandonadoAsync(id);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("finalizar-reparto")]
    public async Task<IActionResult> FinalizarReparto([FromBody] FinalizarRepartoDto dto)
    {
        // Obtener el reparto activo para poder capturar su Id antes de finalizar
        var repartoActivo = await _ventaService.GetRepartoZonaActivoHoyAsync(dto.ZonaId);

        // Calcular y serializar el tally mientras el reparto sigue EnCurso (tiene productos cargados)
        string? tallyJson = null;
        if (repartoActivo != null)
        {
            tallyJson = await _controlCamionetaService.CalcularYSerializarTallyAsync(
                dto.RepartidorId, repartoActivo.Id);
        }

        // Finalizar el reparto
        await _ventaService.FinalizarRepartoZonaAsync(dto.ZonaId, dto.RepartidorId);

        // Guardar el snapshot del tally en el registro ya finalizado
        if (repartoActivo != null && !string.IsNullOrEmpty(tallyJson) && tallyJson != "{}")
        {
            await _ventaService.GuardarTallyRepartoAsync(dto.ZonaId, dto.RepartidorId, tallyJson);
        }

        return Ok();
    }

    [HttpGet("control-camioneta/historial")]
    [Authorize(Roles = "SuperAdmin,Administrador,Local,Repartidor")]
    public async Task<ActionResult<ControlCamionetaHistorialDto>> GetHistorialControlCamioneta([FromQuery] DateTime? fecha)
    {
        var fechaConsulta = fecha?.Date ?? DateTime.Today;
        var result = await _controlCamionetaService.GetHistorialAsync(fechaConsulta);

        var localIdClaim = User.FindFirst("localId")?.Value;
        if (int.TryParse(localIdClaim, out var localId))
        {
            result.Items = result.Items
                .Where(i => i.RepartidorLocalId == null || i.RepartidorLocalId == localId)
                .ToList();
        }

        return Ok(result);
    }

    [HttpGet("control-camioneta")]
    public async Task<ActionResult<ControlCamionetaDto>> GetControlCamioneta()
    {
        var result = await _controlCamionetaService.GetTalliesActivosHoyAsync();
        var localIdClaim = User.FindFirst("localId")?.Value;
        if (int.TryParse(localIdClaim, out var localId))
        {
            result.Repartidores = result.Repartidores
                .Where(t => t.RepartidorLocalId == null || t.RepartidorLocalId == localId)
                .ToList();
        }
        return Ok(result);
    }

    [HttpPost("control-camioneta")]
    public async Task<IActionResult> ControlCamioneta(EmpezarRepartoDto dto)
    {
        var asignaciones = dto.Asignaciones.Select(a => (a.ZonaId, a.RepartidorId));
        var excel = await _controlCamionetaService.GenerarExcelAsync(asignaciones);
        var fecha = DateTime.Today.ToString("yyyy-MM-dd");
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ControlCamionetas_{fecha}.xlsx");
    }
}
