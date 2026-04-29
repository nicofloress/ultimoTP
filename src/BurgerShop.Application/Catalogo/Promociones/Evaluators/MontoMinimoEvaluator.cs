using System.Globalization;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones.Evaluators;

public class MontoMinimoEvaluator : IPromocionConditionEvaluator
{
    public TipoCondicion Tipo => TipoCondicion.MontoMinimo;

    public bool Evaluate(string valor, EvaluacionContexto contexto)
    {
        if (string.IsNullOrWhiteSpace(valor)) return true;
        if (!decimal.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out var minimo))
            return false;
        return contexto.Subtotal >= minimo;
    }
}
