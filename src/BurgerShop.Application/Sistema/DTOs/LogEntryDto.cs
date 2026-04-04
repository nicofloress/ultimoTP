using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Sistema.DTOs;

public record LogEntryDto(
    int Id,
    DateTime Fecha,
    LogNivel Nivel,
    string NivelNombre,
    string Origen,
    string Mensaje,
    string? StackTrace,
    int? UsuarioId,
    string? UsuarioNombre,
    string? Rol,
    int? LocalId,
    string? LocalNombre,
    string? HttpMethod,
    string? Ruta,
    int? StatusCode,
    string? IP,
    long? DuracionMs,
    string? UserAgent);

public record CrearLogEntryDto(
    LogNivel Nivel,
    string Origen,
    string Mensaje,
    string? StackTrace = null,
    int? UsuarioId = null,
    string? UsuarioNombre = null,
    string? Rol = null,
    int? LocalId = null,
    string? LocalNombre = null,
    string? HttpMethod = null,
    string? Ruta = null,
    int? StatusCode = null,
    string? IP = null,
    long? DuracionMs = null,
    string? UserAgent = null);

public record LogEntryPagedResult(
    IReadOnlyList<LogEntryDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);
