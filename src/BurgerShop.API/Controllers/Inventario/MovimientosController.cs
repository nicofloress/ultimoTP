using System.Security.Claims;
using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Inventario;

[ApiController]
[Route("api/movimientos")]
[Authorize(Roles = "SuperAdmin,Administrador,Local")]
public class MovimientosController : ControllerBase
{
    private readonly IMovimientoService _service;

    public MovimientosController(IMovimientoService service) => _service = service;

    /// <summary>
    /// Registra un movimiento manual. El UsuarioId se extrae del token JWT.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MovimientoDto>> Create(CrearMovimientoDto dto)
    {
        var movimiento = await _service.RegistrarMovimientoAsync(dto, ObtenerUsuarioId());
        return CreatedAtAction(nameof(GetByLocal), new { localId = movimiento.LocalId }, movimiento);
    }

    /// <summary>
    /// Registra una devolución de cliente. Genera movimiento DEV_CLI (stock),
    /// NTC_CTA (caja) y, si el cliente tiene cuenta corriente con saldo, un ajuste a favor.
    /// </summary>
    [HttpPost("devolucion")]
    public async Task<ActionResult<MovimientoDto>> RegistrarDevolucion(CrearDevolucionDto dto)
    {
        try
        {
            var resultado = await _service.RegistrarDevolucionAsync(dto, ObtenerUsuarioId());
            return CreatedAtAction(nameof(GetByLocal), new { localId = resultado.LocalId }, resultado);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary>
    /// Lista todos los códigos de acción disponibles para movimientos manuales.
    /// </summary>
    [HttpGet("codigos-accion")]
    public async Task<ActionResult<IEnumerable<CodigoAccionDto>>> GetCodigosAccion()
        => Ok(await _service.GetCodigosAccionAsync());

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
    /// Lista los movimientos asociados a una venta específica.
    /// </summary>
    [HttpGet("venta/{ventaId}")]
    public async Task<ActionResult<IEnumerable<MovimientoDto>>> GetByVenta(int ventaId)
    {
        var movimientos = await _service.GetByVentaAsync(ventaId);
        return Ok(movimientos);
    }

    // ----------------------------------------------------------------
    private int? ObtenerUsuarioId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var uid) ? uid : null;
    }
}
