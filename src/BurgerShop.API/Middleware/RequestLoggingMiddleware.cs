using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using BurgerShop.Application.Sistema.Interfaces;

namespace BurgerShop.API.Middleware;

/// <summary>
/// Middleware que captura excepciones no controladas y las persiste en la base de datos.
/// Solo registra errores (4xx/5xx). Las requests exitosas no generan log para evitar ruido.
/// Usa IServiceScopeFactory porque el middleware es singleton y los servicios de BD son scoped.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
            stopwatch.Stop();

            // Solo logueamos respuestas con error (4xx/5xx) que no fueron excepciones
            if (context.Response.StatusCode >= 400)
            {
                await RegistrarLogAsync(
                    context,
                    stopwatch.ElapsedMilliseconds,
                    excepcion: null);
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Loguear en el sistema de logging de .NET también
            _logger.LogError(ex, "Excepción no controlada en {Method} {Path}",
                context.Request.Method, context.Request.Path);

            // Persistir en BD (con manejo de error separado)
            try
            {
                await RegistrarLogAsync(
                    context,
                    stopwatch.ElapsedMilliseconds,
                    excepcion: ex);
            }
            catch (Exception logEx)
            {
                _logger.LogError(logEx, "Fallo al persistir log de excepción en BD. Error original: {Message}", ex.Message);
            }

            // Escribir respuesta 500 genérica si aún no se envió nada al cliente
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var respuesta = JsonSerializer.Serialize(new
                {
                    message = "Error interno del servidor."
                });

                await context.Response.WriteAsync(respuesta);
            }
        }
    }

    private async Task RegistrarLogAsync(HttpContext context, long duracionMs, Exception? excepcion)
    {
        try
        {
            // Extraer datos del usuario desde los claims JWT
            int? usuarioId = null;
            string? usuarioNombre = null;
            string? rol = null;
            int? localId = null;
            string? localNombre = null;

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var idClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(idClaim, out var parsedId))
                    usuarioId = parsedId;

                usuarioNombre = context.User.FindFirst(ClaimTypes.Name)?.Value;
                rol = context.User.FindFirst(ClaimTypes.Role)?.Value;

                var localIdClaim = context.User.FindFirst("localId")?.Value;
                if (int.TryParse(localIdClaim, out var parsedLocalId))
                    localId = parsedLocalId;
            }

            var origen = excepcion is not null
                ? ObtenerOrigenDeExcepcion(excepcion)
                : $"{context.Request.Method} {context.Request.Path}";

            var mensaje = excepcion is not null
                ? excepcion.Message
                : $"HTTP {context.Response.StatusCode} en {context.Request.Method} {context.Request.Path}";

            var ip = context.Connection.RemoteIpAddress?.ToString();
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var statusCode = context.Response.StatusCode;

            // ILogService es scoped: crear un scope nuevo para persistir
            using var scope = _scopeFactory.CreateScope();
            var logService = scope.ServiceProvider.GetRequiredService<ILogService>();

            await logService.RegistrarErrorAsync(
                origen: origen,
                mensaje: mensaje,
                stackTrace: excepcion?.ToString(),
                usuarioId: usuarioId,
                usuarioNombre: usuarioNombre,
                rol: rol,
                localId: localId,
                localNombre: localNombre,
                httpMethod: context.Request.Method,
                ruta: context.Request.Path.ToString(),
                statusCode: statusCode,
                ip: ip,
                duracionMs: duracionMs,
                userAgent: string.IsNullOrWhiteSpace(userAgent) ? null : userAgent);
        }
        catch (Exception logEx)
        {
            // Si falla el propio sistema de logging, solo escribimos en el logger de .NET
            // para no ocultar el error original ni causar bucles infinitos
            _logger.LogError(logEx, "Error al intentar persistir un log en la base de datos.");
        }
    }

    private static string ObtenerOrigenDeExcepcion(Exception ex)
    {
        // Intentamos extraer el método más relevante del stack trace
        var stackTrace = new StackTrace(ex, fNeedFileInfo: true);
        foreach (var frame in stackTrace.GetFrames())
        {
            var method = frame.GetMethod();
            if (method is null) continue;

            var declaringType = method.DeclaringType?.FullName ?? string.Empty;

            // Ignorar frames internos de ASP.NET Core y .NET runtime
            if (declaringType.StartsWith("Microsoft.") ||
                declaringType.StartsWith("System.") ||
                declaringType.StartsWith("lambda_method"))
                continue;

            return $"{declaringType}.{method.Name}";
        }

        return ex.GetType().Name;
    }
}
