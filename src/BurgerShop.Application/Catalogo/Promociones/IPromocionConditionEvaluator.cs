using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.Promociones;

public interface IPromocionConditionEvaluator
{
    TipoCondicion Tipo { get; }
    bool Evaluate(string valor, EvaluacionContexto contexto);
}
