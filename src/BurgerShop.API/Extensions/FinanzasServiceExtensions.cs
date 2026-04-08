using BurgerShop.Application.Finanzas.Interfaces;
using BurgerShop.Application.Finanzas.Services;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Infrastructure.Repositories.Finanzas;

namespace BurgerShop.API.Extensions;

public static class FinanzasServiceExtensions
{
    public static IServiceCollection AddFinanzasServices(this IServiceCollection services)
    {
        services.AddScoped<ICierreCajaRepository, CierreCajaRepository>();
        services.AddScoped<ICierreCajaService, CierreCajaService>();

        services.AddScoped<IGastoRepository, GastoRepository>();
        services.AddScoped<IGastoService, GastoService>();

        return services;
    }
}
