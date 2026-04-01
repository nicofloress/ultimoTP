using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Inventario;

[ApiController]
[Route("api/stock")]
[Authorize(Roles = "SuperAdmin,Administrador")]
public class StockController : ControllerBase
{
    private readonly IArtiStockService _service;

    public StockController(IArtiStockService service) => _service = service;

    /// <summary>
    /// Devuelve el stock actual de todos los productos en un local.
    /// </summary>
    [HttpGet("local/{localId}")]
    public async Task<ActionResult<IEnumerable<ArtiStockDto>>> GetByLocal(int localId)
        => Ok(await _service.GetByLocalAsync(localId));

    /// <summary>
    /// Devuelve los productos cuyo stock está por debajo del mínimo configurado.
    /// </summary>
    [HttpGet("local/{localId}/bajo")]
    public async Task<ActionResult<IEnumerable<ArtiStockDto>>> GetStockBajo(int localId)
        => Ok(await _service.GetStockBajoAsync(localId));

    /// <summary>
    /// Actualiza el stock mínimo de un producto en un local.
    /// </summary>
    [HttpPut("minimo")]
    public async Task<ActionResult> ActualizarMinimo(ActualizarStockMinimoDto dto)
    {
        await _service.ActualizarStockMinimoAsync(dto);
        return NoContent();
    }
}
