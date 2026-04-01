using System.Security.Claims;
using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Inventario;

[ApiController]
[Route("api/movimientos")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class MovimientosController : ControllerBase
{
    private readonly IMovimientoService _service;

    public MovimientosController(IMovimientoService service) => _service = service;

    /// <summary>
    /// Lista todos los códigos de acción disponibles para movimientos manuales.
    /// </summary>
    [HttpGet("codigos-accion")]
    public async Task<ActionResult<IEnumerable<CodigoAccionDto>>> GetCodigosAccion()
        => Ok(await _service.GetCodigosAccionAsync());

    /// <summary>
    /// Registra un movimiento manual. El UsuarioId se extrae del token JWT.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MovimientoDto>> Create(CrearMovimientoDto dto)
    {
        // Extraer el id del usuario autenticado desde el claim "sub" o "nameidentifier"
        var usuarioIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        int? usuarioId = null;
        if (int.TryParse(usuarioIdClaim, out var uid))
            usuarioId = uid;

        var movimiento = await _service.RegistrarMovimientoAsync(dto, usuarioId);
        return CreatedAtAction(nameof(GetByLocal), new { localId = movimiento.LocalId }, movimiento);
    }

    /// <summary>
    /// Lista movimientos de un local, con filtro opcional por rango de fechas.
    /// </summary>
    [HttpGet("local/{localId}")]
    public async Task<ActionResult<IEnumerable<MovimientoDto>>> GetByLocal(
        int localId,
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null)
    {
        var movimientos = await _service.GetByLocalAsync(localId, desde, hasta);
        return Ok(movimientos);
    }

    /// <summary>
    /// Lista movimientos de un producto en un local, con filtro opcional por rango de fechas.
    /// </summary>
    [HttpGet("producto/{productoId}/local/{localId}")]
    public async Task<ActionResult<IEnumerable<MovimientoDto>>> GetByProductoLocal(
        int productoId,
        int localId,
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null)
    {
        var movimientos = await _service.GetByProductoLocalAsync(productoId, localId, desde, hasta);
        return Ok(movimientos);
    }

    /// <summary>
    /// Lista los movimientos asociados a un pedido específico.
    /// </summary>
    [HttpGet("pedido/{pedidoId}")]
    public async Task<ActionResult<IEnumerable<MovimientoDto>>> GetByPedido(int pedidoId)
    {
        var movimientos = await _service.GetByPedidoAsync(pedidoId);
        return Ok(movimientos);
    }
}
