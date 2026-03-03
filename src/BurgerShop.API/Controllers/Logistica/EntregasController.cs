using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
public class EntregasController : ControllerBase
{
    private readonly IPedidoService _pedidoService;

    public EntregasController(IPedidoService pedidoService) => _pedidoService = pedidoService;

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
    public async Task<ActionResult<PedidoDto>> MarcarEntregado(int pedidoId, [FromBody] string? notas)
    {
        var pedido = await _pedidoService.MarcarEntregadoAsync(pedidoId, notas);
        return pedido is null ? NotFound() : Ok(pedido);
    }
}
