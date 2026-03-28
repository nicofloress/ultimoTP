using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Sistema;

public class LogEntry
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public LogNivel Nivel { get; set; }

    /// <summary>Controller, método o middleware que generó el log.</summary>
    public string Origen { get; set; } = string.Empty;

    /// <summary>Descripción del error o evento.</summary>
    public string Mensaje { get; set; } = string.Empty;

    /// <summary>Stack trace completo si proviene de una excepción.</summary>
    public string? StackTrace { get; set; }

    public int? UsuarioId { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? Rol { get; set; }

    public string? HttpMethod { get; set; }
    public string? Ruta { get; set; }
    public int? StatusCode { get; set; }
    public string? IP { get; set; }

    /// <summary>Duración de la request en milisegundos.</summary>
    public long? DuracionMs { get; set; }

    public string? UserAgent { get; set; }
}
