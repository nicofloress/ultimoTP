using BurgerShop.Application.Sistema.DTOs;
using BurgerShop.Application.Sistema.Interfaces;
using BurgerShop.Domain.Entities.Sistema;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces.Sistema;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Sistema.Services;

public class LogService : ILogService
{
    private readonly ILogEntryRepository _repo;
    private readonly ILogger<LogService> _logger;

    public LogService(ILogEntryRepository repo, ILogger<LogService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<LogEntryDto> RegistrarAsync(CrearLogEntryDto dto)
    {
        try
        {
            var entry = new LogEntry
            {
                Fecha = DateTime.Now,
                Nivel = dto.Nivel,
                Origen = dto.Origen,
                Mensaje = dto.Mensaje,
                StackTrace = dto.StackTrace,
                UsuarioId = dto.UsuarioId,
                UsuarioNombre = dto.UsuarioNombre,
                Rol = dto.Rol,
                LocalId = dto.LocalId,
                LocalNombre = dto.LocalNombre,
                HttpMethod = dto.HttpMethod,
                Ruta = dto.Ruta,
                StatusCode = dto.StatusCode,
                IP = dto.IP,
                DuracionMs = dto.DuracionMs,
                UserAgent = dto.UserAgent
            };

            await _repo.AddAsync(entry);
            await _repo.SaveChangesAsync();

            return ToDto(entry);
        }
        catch (Exception ex)
        {
            // LogService no debe silenciar errores propios — los registramos en el logger de infraestructura
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarAsync), ex.Message);
            throw;
        }
    }

    public async Task<LogEntryPagedResult> GetPaginatedAsync(
        DateTime? desde,
        DateTime? hasta,
        LogNivel? nivel,
        string? busqueda,
        int page = 1,
        int pageSize = 50)
    {
        try
        {
            var (items, totalCount) = await _repo.GetPaginatedAsync(desde, hasta, nivel, busqueda, page, pageSize);

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new LogEntryPagedResult(
                items.Select(ToDto).ToList().AsReadOnly(),
                totalCount,
                page,
                pageSize,
                totalPages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetPaginatedAsync), ex.Message);
            throw;
        }
    }

    public async Task RegistrarErrorAsync(
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
        string? userAgent)
    {
        try
        {
            var nivel = statusCode >= 500 ? LogNivel.Error : LogNivel.Warning;

            await RegistrarAsync(new CrearLogEntryDto(
                Nivel: nivel,
                Origen: origen,
                Mensaje: mensaje,
                StackTrace: stackTrace,
                UsuarioId: usuarioId,
                UsuarioNombre: usuarioNombre,
                Rol: rol,
                LocalId: localId,
                LocalNombre: localNombre,
                HttpMethod: httpMethod,
                Ruta: ruta,
                StatusCode: statusCode,
                IP: ip,
                DuracionMs: duracionMs,
                UserAgent: userAgent));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarErrorAsync), ex.Message);
            throw;
        }
    }

    public async Task<int> LimpiarAntiguosAsync(int dias = 30)
    {
        try
        {
            return await _repo.LimpiarAntiguosAsync(dias);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(LimpiarAntiguosAsync), ex.Message);
            throw;
        }
    }

    private static LogEntryDto ToDto(LogEntry l) => new(
        l.Id,
        l.Fecha,
        l.Nivel,
        l.Nivel.ToString(),
        l.Origen,
        l.Mensaje,
        l.StackTrace,
        l.UsuarioId,
        l.UsuarioNombre,
        l.Rol,
        l.LocalId,
        l.LocalNombre,
        l.HttpMethod,
        l.Ruta,
        l.StatusCode,
        l.IP,
        l.DuracionMs,
        l.UserAgent);
}
