using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Finanzas;

[ApiController]
[Route("api/caja")]
[Authorize]
public class CajaController : ControllerBase
{
    private readonly ICierreCajaService _service;

    public CajaController(ICierreCajaService service) => _service = service;

    private int? GetLocalIdFromClaims()
    {
        var claim = User.FindFirst("localId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("abierta")]
    public async Task<ActionResult<CierreCajaDto>> GetCajaAbierta([FromQuery] int? localId = null)
    {
        var lid = localId ?? GetLocalIdFromClaims();
        var caja = await _service.GetCajaAbiertaAsync(lid);
        return caja is null ? NoContent() : Ok(caja);
    }

    [HttpPost("abrir")]
    public async Task<ActionResult<CierreCajaDto>> AbrirCaja(AbrirCajaDto dto)
    {
        try
        {
            // Si no viene localId en el DTO, usar el del JWT
            var dtoConLocal = dto.LocalId.HasValue ? dto : dto with { LocalId = GetLocalIdFromClaims() };
            var caja = await _service.AbrirCajaAsync(dtoConLocal);
            return CreatedAtAction(nameof(GetById), new { id = caja.Id }, caja);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id}/cerrar")]
    public async Task<ActionResult<CierreCajaDto>> CerrarCaja(int id, CerrarCajaDto dto)
    {
        var caja = await _service.CerrarCajaAsync(id, dto);
        return caja is null ? NotFound() : Ok(caja);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CierreCajaDto>>> GetHistorial(
        [FromQuery] int? localId = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null)
    {
        // Administrador/Local solo puede ver cajas de su local; SuperAdmin puede filtrar arbitrariamente
        var rol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
               ?? User.FindFirst("role")?.Value;
        int? lid;
        if (string.Equals(rol, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            lid = localId;
        else
            lid = GetLocalIdFromClaims() ?? localId;
        var historial = await _service.GetHistorialAsync(lid, fechaDesde, fechaHasta);
        return Ok(historial);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CierreCajaDto>> GetById(int id)
    {
        var caja = await _service.GetByIdAsync(id);
        return caja is null ? NotFound() : Ok(caja);
    }

    [HttpGet("pendientes")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<ActionResult<IEnumerable<CierreCajaDto>>> GetPendientesRevision([FromQuery] int? localId = null)
    {
        // Administrador solo puede ver cajas de su local; SuperAdmin puede ver todas o filtrar
        var rol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
               ?? User.FindFirst("role")?.Value;
        int? lidEfectivo;
        if (string.Equals(rol, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            lidEfectivo = localId;
        }
        else
        {
            lidEfectivo = GetLocalIdFromClaims() ?? localId;
        }
        var pendientes = await _service.GetPendientesRevisionAsync(lidEfectivo);
        return Ok(pendientes);
    }

    [HttpPut("{id}/revisar")]
    [Authorize(Roles = "SuperAdmin,Administrador")]
    public async Task<ActionResult<CierreCajaDto>> RevisarCaja(int id, RevisarCajaDto dto)
    {
        try
        {
            var usuarioId = GetUsuarioIdFromClaims();
            var caja = await _service.RevisarCajaAsync(id, dto, usuarioId);
            return caja is null ? NotFound() : Ok(caja);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpGet("{id}/ventas")]
    public async Task<ActionResult<IEnumerable<VentaCajaDto>>> GetVentasCaja(int id)
    {
        var ventas = await _service.GetVentasCajaAsync(id);
        return Ok(ventas);
    }

    private int? GetUsuarioIdFromClaims()
    {
        var claim = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
}
