using BurgerShop.Application.Dashboard.DTOs;
using BurgerShop.Application.Dashboard.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BurgerShop.API.Controllers.Dashboard;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    /// <summary>
    /// GET /api/dashboard?localId=1
    /// - SuperAdmin sin localId: obtiene datos globales + comparativa entre locales.
    /// - SuperAdmin con localId: obtiene datos del local indicado sin comparativa.
    /// - Administrador/Local: usa el localId del JWT claim.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard([FromQuery] int? localId = null)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value
               ?? User.FindFirst("role")?.Value;

        int? localIdEfectivo;
        bool esSuperAdmin = string.Equals(rol, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

        if (esSuperAdmin)
        {
            // SuperAdmin puede ver todos los locales o filtrar por uno específico
            localIdEfectivo = localId;
        }
        else
        {
            // Otros roles usan su localId del token; si pasaron uno por query, se ignora
            var localIdClaim = User.FindFirst("localId")?.Value;
            localIdEfectivo = int.TryParse(localIdClaim, out var parsed) ? parsed : localId;
        }

        // La comparativa solo aplica cuando el SuperAdmin consulta sin filtro de local
        var incluirComparativa = esSuperAdmin && !localIdEfectivo.HasValue;

        var dashboard = await _service.GetDashboardAsync(localIdEfectivo, incluirComparativa);
        return Ok(dashboard);
    }
}
