using BurgerShop.Application.Sistema.DTOs;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Sistema.Interfaces;

public interface ILogService
{
    Task<LogEntryDto> RegistrarAsync(CrearLogEntryDto dto);

    Task<LogEntryPagedResult> GetPaginatedAsync(
        DateTime? desde,
        DateTime? hasta,
        LogNivel? nivel,
        string? busqueda,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Shortcut para registrar errores desde el middleware de manejo de excepciones.
    /// </summary>
    Task RegistrarErrorAsync(
        string origen,
        string mensaje,
        string? stackTrace,
        int? usuarioId,
        string? usuarioNombre,
        string? rol,
        int? localId,
        string? localNombre,
        string? httpMethod,
        string? ruta,
        int? statusCode,
        string? ip,
        long? duracionMs,
        string? userAgent);

    /// <summary>Elimina logs más antiguos que <paramref name="dias"/> días. Devuelve la cantidad eliminada.</summary>
    Task<int> LimpiarAntiguosAsync(int dias = 30);
}
