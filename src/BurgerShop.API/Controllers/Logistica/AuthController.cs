using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Logistica;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IRepartidorService _repartidorService;

    public AuthController(IRepartidorService repartidorService) => _repartidorService = repartidorService;

    [HttpPost("repartidor")]
    public async Task<ActionResult<RepartidorLoginResultDto>> LoginRepartidor(LoginRepartidorDto dto)
    {
        var result = await _repartidorService.LoginAsync(dto.CodigoAcceso);
        if (result is null) return Unauthorized(new { message = "Código de acceso inválido" });
        return Ok(result);
    }
}
