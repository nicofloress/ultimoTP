using System.Text.Json;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones.Evaluators;

public class HorarioEvaluator : IPromocionConditionEvaluator
{
    public TipoCondicion Tipo => TipoCondicion.Horario;

    private record Rango(string Desde, string Hasta);

    public bool Evaluate(string valor, EvaluacionContexto contexto)
    {
        if (string.IsNullOrWhiteSpace(valor)) return true;
        try
        {
            var rango = JsonSerializer.Deserialize<Rango>(valor);
            if (rango is null) return true;
            if (!TimeOnly.TryParse(rango.Desde, out var desde)) return false;
            if (!TimeOnly.TryParse(rango.Hasta, out var hasta)) return false;
            var hora = TimeOnly.FromDateTime(contexto.Fecha);
            return desde <= hasta
                ? hora >= desde && hora <= hasta
                : hora >= desde || hora <= hasta;
        }
        catch
        {
            return false;
        }
    }
}
