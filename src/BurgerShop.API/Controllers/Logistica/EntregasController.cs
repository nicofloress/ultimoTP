using BurgerShop.Application.Logistica.Interfaces;
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

    public EntregasController(IPedidoService pedidoService, IControlCamionetaService controlCamionetaService)
    {
        _pedidoService = pedidoService;
        _controlCamionetaService = controlCamionetaService;
    }

    [HttpGet("pendientes")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetPendientes()
        => Ok(await _pedidoService.GetPendientesEntregaAsync());

    [HttpPost("asignar")]
    public async Task<ActionResult<PedidoDto>> Asignar(AsignarEntregaDto dto)
    {
        var pedido = await _pedidoService.AsignarRepartidorAsync(dto.PedidoId, dto.RepartidorId);
        return pedido is null ? NotFound() : Ok(pedido);
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
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpGet("por-zona")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetPorZona()
        => Ok(await _pedidoService.GetListosParaRepartoHoyAsync());

    [HttpPost("empezar-reparto")]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> EmpezarReparto(EmpezarRepartoDto dto)
    {
        try
        {
            var pedidos = await _pedidoService.EmpezarRepartoAsync(dto);
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
