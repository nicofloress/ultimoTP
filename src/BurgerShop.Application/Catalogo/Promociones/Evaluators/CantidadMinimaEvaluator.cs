using System.Globalization;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones.Evaluators;

public class CantidadMinimaEvaluator : IPromocionConditionEvaluator
{
    public TipoCondicion Tipo => TipoCondicion.CantidadMinima;

    public bool Evaluate(string valor, EvaluacionContexto contexto)
    {
        if (string.IsNullOrWhiteSpace(valor)) return true;
        if (!int.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out var minimo))
            return false;
        return contexto.CantidadTotalItems >= minimo;
    }
}
