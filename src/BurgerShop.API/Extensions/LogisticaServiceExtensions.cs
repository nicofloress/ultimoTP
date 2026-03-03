using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Application.Logistica.Services;
using BurgerShop.Domain.Interfaces.Logistica;
using BurgerShop.Infrastructure.Repositories.Logistica;

namespace BurgerShop.API.Extensions;

public static class LogisticaServiceExtensions
{
    public static IServiceCollection AddLogisticaServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IRepartidorRepository, RepartidorRepository>();

        // Services
        services.AddScoped<IZonaService, ZonaService>();
        services.AddScoped<IRepartidorService, RepartidorService>();

        return services;
    }
}
