using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Application.Catalogo.Promociones;
using BurgerShop.Application.Catalogo.Promociones.Evaluators;
using BurgerShop.Application.Catalogo.Services;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Infrastructure.Repositories.Catalogo;

namespace BurgerShop.API.Extensions;

public static class CatalogoServiceExtensions
{
    public static IServiceCollection AddCatalogoServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IProductoRepository, ProductoRepository>();
        services.AddScoped<IComboRepository, ComboRepository>();
        services.AddScoped<IListaPrecioRepository, ListaPrecioRepository>();
        services.AddScoped<IPromocionRepository, PromocionRepository>();
        services.AddScoped<IMarcaRepository, MarcaRepository>();

        // Services
        services.AddScoped<ICategoriaService, CategoriaService>();
        services.AddScoped<IProductoService, ProductoService>();
        services.AddScoped<IComboService, ComboService>();
        services.AddScoped<IProveedorService, ProveedorService>();
        services.AddScoped<IMarcaService, MarcaService>();
        services.AddScoped<IListaPrecioService, ListaPrecioService>();
        services.AddScoped<IPromocionService, PromocionService>();

        // Promociones - evaluators de condiciones (strategy pattern)
        services.AddScoped<IPromocionConditionEvaluator, DiaSemanaEvaluator>();
        services.AddScoped<IPromocionConditionEvaluator, FormaPagoEvaluator>();
        services.AddScoped<IPromocionConditionEvaluator, MontoMinimoEvaluator>();
        services.AddScoped<IPromocionConditionEvaluator, HorarioEvaluator>();
        services.AddScoped<IPromocionConditionEvaluator, CantidadMinimaEvaluator>();
        services.AddScoped<IPromocionEvaluatorService, PromocionEvaluatorService>();

        return services;
    }
}
