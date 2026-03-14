using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Application.Notificaciones;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Repartidor")]
public class EntregasController : ControllerBase
{
    private readonly IPedidoService _pedidoService;
    private readonly IControlCamionetaService _controlCamionetaService;
    private readonly INotificacionService _notificaciones;

    public EntregasController(
        IPedidoService pedidoService,
        IControlCamionetaService controlCamionetaService,
        INotificacionService notificaciones)
    {
        _pedidoService = pedidoService;
        _controlCamionetaService = controlCamionetaService;
        _notificaciones = notificaciones;
    }

    [HttpGet("pendientes")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetPendientes()
        => Ok(await _pedidoService.GetPendientesEntregaAsync());

    [HttpPost("asignar")]
    public async Task<ActionResult<PedidoDto>> Asignar(AsignarEntregaDto dto)
    {
        var pedido = await _pedidoService.AsignarRepartidorAsync(dto.PedidoId, dto.RepartidorId);
        if (pedido is null) return NotFound();
        await _notificaciones.NotificarPedidoAsignadoAsync(
            dto.RepartidorId, pedido.Id, pedido.NumeroTicket, pedido.DireccionEntrega);
        return Ok(pedido);
    }

    [HttpGet("repartidor/{id}")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetByRepartidor(int id)
        => Ok(await _pedidoService.GetEntregasRepartidorHoyAsync(id));

    [HttpPut("{pedidoId}/en-camino")]
    public async Task<ActionResult<PedidoDto>> MarcarEnCamino(int pedidoId)
    {
        var pedido = await _pedidoService.MarcarEnCaminoAsync(pedidoId);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPut("{pedidoId}/entregar")]
    public async Task<ActionResult<PedidoDto>> MarcarEntregado(int pedidoId, [FromBody] MarcarEntregadoDto dto)
    {
        var pedido = await _pedidoService.MarcarEntregadoAsync(pedidoId, dto);
        if (pedido is null) return NotFound();
        await _notificaciones.NotificarPedidoEntregadoAsync(pedido.Id, pedido.NumeroTicket, pedido.RepartidorNombre);
        return Ok(pedido);
    }

    [HttpPut("{pedidoId}/no-entregado")]
    public async Task<ActionResult<PedidoDto>> MarcarNoEntregado(int pedidoId, [FromBody] CancelarPedidoDto dto)
    {
        try
        {
            var pedido = await _pedidoService.MarcarNoEntregadoAsync(pedidoId, dto.Motivo);
            return pedido is null ? NotFound() : Ok(pedido);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("por-zona")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetPorZona()
        => Ok(await _pedidoService.GetListosParaRepartoHoyAsync());

    [HttpPost("empezar-reparto")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> EmpezarReparto(EmpezarRepartoDto dto)
    {
        try
        {
            var pedidos = (await _pedidoService.EmpezarRepartoAsync(dto)).ToList();

            // Notificar a cada repartidor cuántos pedidos le tocaron
            var asignaciones = pedidos
                .Where(p => p.RepartidorId.HasValue)
                .GroupBy(p => p.RepartidorId!.Value)
                .Select(g => (g.Key, g.Count()));
            await _notificaciones.NotificarRepartoIniciadoAsync(asignaciones);

            return Ok(pedidos);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
