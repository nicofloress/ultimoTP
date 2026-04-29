using System.Text.Json;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones.Evaluators;

public class FormaPagoEvaluator : IPromocionConditionEvaluator
{
    public TipoCondicion Tipo => TipoCondicion.FormaPago;

    public bool Evaluate(string valor, EvaluacionContexto contexto)
    {
        if (string.IsNullOrWhiteSpace(valor)) return true;
        if (contexto.FormaPagoId is null) return false;
        try
        {
            var formas = JsonSerializer.Deserialize<int[]>(valor) ?? Array.Empty<int>();
            if (formas.Length == 0) return true;
            return formas.Contains(contexto.FormaPagoId.Value);
        }
        catch
        {
            return false;
        }
    }
}
