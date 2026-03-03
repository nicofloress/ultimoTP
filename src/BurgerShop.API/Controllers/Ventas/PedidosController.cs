using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/[controller]")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _service;

    public PedidosController(IPedidoService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<PedidoDto>> Create(CrearPedidoDto dto)
    {
        var pedido = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = pedido.Id }, pedido);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetAll(
        [FromQuery] DateTime? fecha, [FromQuery] EstadoPedido? estado)
    {
        if (estado.HasValue)
            return Ok(await _service.GetByEstadoAsync(estado.Value));
        return Ok(await _service.GetByFechaAsync(fecha ?? DateTime.Today));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PedidoDto>> GetById(int id)
    {
        var pedido = await _service.GetByIdAsync(id);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPut("{id}/estado")]
    public async Task<ActionResult<PedidoDto>> CambiarEstado(int id, CambiarEstadoDto dto)
    {
        var pedido = await _service.CambiarEstadoAsync(id, dto.NuevoEstado);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPut("{id}/cancelar")]
    public async Task<ActionResult<PedidoDto>> Cancelar(int id)
    {
        var pedido = await _service.CancelarAsync(id);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpGet("{id}/ticket")]
    public async Task<ActionResult<TicketDto>> GetTicket(int id)
    {
        var ticket = await _service.GetTicketAsync(id);
        return ticket is null ? NotFound() : Ok(ticket);
    }
}
