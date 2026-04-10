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
    int? LocalId,
    string? LocalNombre,
    List<CierreCajaDetalleDto> Detalles,
    int CantidadTotal,
    decimal TotalGeneral,
    int CantidadMostrador = 0,
    decimal TotalMostrador = 0,
    int CantidadDomicilio = 0,
    decimal TotalDomicilio = 0,
    int CantidadCtaCte = 0,
    decimal TotalCtaCte = 0);

public record CierreCajaDetalleDto(
    int Id,
    int FormaPagoId,
    string FormaPagoNombre,
    decimal MontoTotal,
    int CantidadOperaciones);

public record AbrirCajaDto(decimal MontoInicial, string? Observaciones, int? LocalId = null);

public record CerrarCajaDto(string? Observaciones);
