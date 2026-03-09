using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Finanzas.DTOs;

public record CierreCajaDto(
    int Id,
    DateTime FechaApertura,
    DateTime? FechaCierre,
    decimal MontoInicial,
    decimal? MontoFinal,
    EstadoCaja Estado,
    string? Observaciones,
    int? UsuarioId,
    List<CierreCajaDetalleDto> Detalles,
    int CantidadPedidos,
    decimal TotalVentas);

public record CierreCajaDetalleDto(
    int Id,
    int FormaPagoId,
    string FormaPagoNombre,
    decimal MontoTotal,
    int CantidadOperaciones);

public record AbrirCajaDto(decimal MontoInicial, string? Observaciones);

public record CerrarCajaDto(string? Observaciones);
