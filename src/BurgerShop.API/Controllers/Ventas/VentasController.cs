using System.Security.Claims;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VentasController : ControllerBase
{
    private readonly IVentaService _service;

    public VentasController(IVentaService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Local")]
    public async Task<ActionResult<VentaDto>> CrearVenta(CrearVentaDto dto)
    {
        int? usuarioId = null;
        if (int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid))
            usuarioId = uid;

        var venta = await _service.CrearVentaMostradorAsync(dto, usuarioId);
        return CreatedAtAction(nameof(GetById), new { id = venta.Id }, venta);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VentaDto>>> GetAll(
        [FromQuery] DateTime? fecha,
        [FromQuery] DateTime? fechaHasta)
    {
        if (fechaHasta.HasValue)
            return Ok(await _service.GetByRangoFechasAsync(fecha ?? DateTime.Today, fechaHasta.Value));

        return Ok(await _service.GetByFechaAsync(fecha ?? DateTime.Today));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VentaDto>> GetById(int id)
    {
        var venta = await _service.GetByIdAsync(id);
        return venta is null ? NotFound() : Ok(venta);
    }

    [HttpGet("por-pedido/{pedidoId}")]
    public async Task<ActionResult<VentaDto>> GetByPedidoId(int pedidoId)
    {
        var venta = await _service.GetByPedidoIdAsync(pedidoId);
        return venta is null ? NotFound() : Ok(venta);
    }
}
