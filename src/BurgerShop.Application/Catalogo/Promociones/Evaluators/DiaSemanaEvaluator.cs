using System.Text.Json;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones.Evaluators;

public class DiaSemanaEvaluator : IPromocionConditionEvaluator
{
    public TipoCondicion Tipo => TipoCondicion.DiaSemana;

    public bool Evaluate(string valor, EvaluacionContexto contexto)
    {
        if (string.IsNullOrWhiteSpace(valor)) return true;
        try
        {
            var dias = JsonSerializer.Deserialize<int[]>(valor) ?? Array.Empty<int>();
            if (dias.Length == 0) return true;
            return dias.Contains((int)contexto.Fecha.DayOfWeek);
        }
        catch
        {
            return false;
        }
    }
}
