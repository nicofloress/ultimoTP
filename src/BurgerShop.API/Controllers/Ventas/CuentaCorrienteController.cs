using System.Security.Claims;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerShop.API.Controllers.Ventas;

[ApiController]
[Route("api/cuenta-corriente")]
[Authorize(Roles = "SuperAdmin,Administrador,Local")]
public class CuentaCorrienteController : ControllerBase
{
    private readonly ICuentaCorrienteService _service;

    public CuentaCorrienteController(ICuentaCorrienteService service)
    {
        _service = service;
    }

    // GET /api/cuenta-corriente
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CuentaCorrienteDto>>> GetAllActivas()
    {
        var cuentas = await _service.GetAllActivasAsync();
        return Ok(cuentas);
    }

    // GET /api/cuenta-corriente/con-saldo
    [HttpGet("con-saldo")]
    public async Task<ActionResult<IEnumerable<CuentaCorrienteDto>>> GetConSaldo()
    {
        var cuentas = await _service.GetConSaldoAsync();
        return Ok(cuentas);
    }

    // GET /api/cuenta-corriente/cliente/{clienteId}
    [HttpGet("cliente/{clienteId:int}")]
    public async Task<ActionResult<CuentaCorrienteDto>> GetByCliente(int clienteId)
    {
        var cuenta = await _service.GetByClienteIdAsync(clienteId);
        return cuenta is null ? NotFound() : Ok(cuenta);
    }

    // GET /api/cuenta-corriente/cliente/{clienteId}/movimientos?desde=...&hasta=...
    [HttpGet("cliente/{clienteId:int}/movimientos")]
    public async Task<ActionResult<IEnumerable<MovimientoCuentaCorrienteDto>>> GetMovimientos(
        int clienteId,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var movimientos = await _service.GetMovimientosAsync(clienteId, desde, hasta);
        return Ok(movimientos);
    }

    // POST /api/cuenta-corriente/cargo
    [HttpPost("cargo")]
    public async Task<ActionResult<MovimientoCuentaCorrienteDto>> RegistrarCargo(
        [FromBody] CrearCargoDto dto)
    {
        int? usuarioId = ObtenerUsuarioId();
        var movimiento = await _service.RegistrarCargoAsync(dto, usuarioId);
        return Ok(movimiento);
    }

    // POST /api/cuenta-corriente/pago
    [HttpPost("pago")]
    public async Task<ActionResult<MovimientoCuentaCorrienteDto>> RegistrarPago(
        [FromBody] CrearPagoCtaCteDto dto)
    {
        int? usuarioId = ObtenerUsuarioId();
        var movimiento = await _service.RegistrarPagoAsync(dto, usuarioId);
        return Ok(movimiento);
    }

    // POST /api/cuenta-corriente/ajuste
    [HttpPost("ajuste")]
    public async Task<ActionResult<MovimientoCuentaCorrienteDto>> RegistrarAjuste(
        [FromBody] CrearAjusteDto dto)
    {
        int? usuarioId = ObtenerUsuarioId();
        var movimiento = await _service.RegistrarAjusteAsync(dto, usuarioId);
        return Ok(movimiento);
    }

    // PUT /api/cuenta-corriente/cliente/{clienteId}/limite
    [HttpPut("cliente/{clienteId:int}/limite")]
    public async Task<ActionResult<CuentaCorrienteDto>> ActualizarLimite(
        int clienteId,
        [FromBody] ActualizarLimiteDto dto)
    {
        var cuenta = await _service.ActualizarLimiteCreditoAsync(clienteId, dto.LimiteCredito);
        return Ok(cuenta);
    }

    private int? ObtenerUsuarioId()
    {
        if (int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid))
            return uid;
        return null;
    }
}

/// <summary>DTO para actualizar el limite de credito de una cuenta corriente.</summary>
public record ActualizarLimiteDto(decimal LimiteCredito);
