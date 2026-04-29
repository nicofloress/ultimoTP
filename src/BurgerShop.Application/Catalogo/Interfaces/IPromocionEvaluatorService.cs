using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IPromocionEvaluatorService
{
    Task<EvaluarPromocionesResultDto> EvaluarAsync(EvaluarPromocionesContextDto ctx);
}
