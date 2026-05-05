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

        // Buffer la respuesta para poder leer el body si hay error
        var originalBodyStream = context.Response.Body;
        using var memStream = new MemoryStream();
        context.Response.Body = memStream;

        try
        {
            await _next(context);
            stopwatch.Stop();

            string? responseBody = null;
            if (context.Response.StatusCode >= 400 && memStream.Length > 0)
            {
                memStream.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(memStream, leaveOpen: true);
                responseBody = await reader.ReadToEndAsync();
            }

            // Volcar el buffer al stream real para que el cliente reciba la respuesta
            memStream.Seek(0, SeekOrigin.Begin);
            await memStream.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;

            // Solo logueamos respuestas con error (4xx/5xx) que no fueron excepciones
            if (context.Response.StatusCode >= 400)
            {
                await RegistrarLogAsync(
                    context,
                    stopwatch.ElapsedMilliseconds,
                    excepcion: null,
                    responseBody: responseBody);
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Restaurar el body stream antes de escribir la respuesta de error
            context.Response.Body = originalBodyStream;

            // Loguear en el sistema de logging de .NET también
            _logger.LogError(ex, "Excepción no controlada en {Method} {Path}",
                context.Request.Method, context.Request.Path);

            // Persistir en BD (con manejo de error separado)
            try
            {
                await RegistrarLogAsync(
                    context,
                    stopwatch.ElapsedMilliseconds,
                    excepcion: ex,
                    responseBody: null);
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

    private async Task RegistrarLogAsync(HttpContext context, long duracionMs, Exception? excepcion, string? responseBody = null)
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

            // Si tenemos response body (errores 4xx con BadRequest), intentar extraer el mensaje
            if (excepcion is null && !string.IsNullOrWhiteSpace(responseBody))
            {
                var detalle = ExtraerMensajeDeBody(responseBody);
                if (!string.IsNullOrWhiteSpace(detalle))
                    mensaje = $"{mensaje} - {detalle}";
            }

            var ip = context.Connection.RemoteIpAddress?.ToString();
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var statusCode = context.Response.StatusCode;

            // ILogService es scoped: crear un scope nuevo para persistir
            using var scope = _scopeFactory.CreateScope();
            var logService = scope.ServiceProvider.GetRequiredService<ILogService>();

            // Resolver localNombre desde la BD si tenemos localId
            if (localId.HasValue && string.IsNullOrEmpty(localNombre))
            {
                try
                {
                    var db = scope.ServiceProvider.GetRequiredService<BurgerShop.Infrastructure.Data.BurgerShopDbContext>();
                    var local = await db.Locales.FindAsync(localId.Value);
                    localNombre = local?.Nombre;
                }
                catch { /* no bloquear el logging */ }
            }

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

    private static string? ExtraerMensajeDeBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return body.Length > 500 ? body.Substring(0, 500) : body;

            // Probar varias claves comunes
            foreach (var key in new[] { "mensaje", "message", "error", "title", "detail" })
            {
                if (root.TryGetProperty(key, out var prop) && prop.ValueKind == JsonValueKind.String)
                {
                    var valor = prop.GetString();
                    if (!string.IsNullOrWhiteSpace(valor)) return valor;
                }
            }

            // ProblemDetails / ValidationProblemDetails: errors es un objeto con arrays
            if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Object)
            {
                var partes = new List<string>();
                foreach (var prop in errors.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var msg in prop.Value.EnumerateArray())
                        {
                            if (msg.ValueKind == JsonValueKind.String)
                                partes.Add($"{prop.Name}: {msg.GetString()}");
                        }
                    }
                }
                if (partes.Count > 0) return string.Join("; ", partes);
            }

            return body.Length > 500 ? body.Substring(0, 500) : body;
        }
        catch
        {
            return body.Length > 500 ? body.Substring(0, 500) : body;
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
