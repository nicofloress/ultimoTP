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
        services.AddScoped<IMensajeRepository, MensajeRepository>();
        services.AddScoped<IUbicacionRepartidorRepository, UbicacionRepartidorRepository>();

        services.AddScoped<IRendicionRepository, RendicionRepository>();

        // Services
        services.AddScoped<IZonaService, ZonaService>();
        services.AddScoped<IRepartidorService, RepartidorService>();
        services.AddScoped<IControlCamionetaService, ControlCamionetaService>();
        services.AddScoped<IMensajeService, MensajeService>();
        services.AddScoped<ITrackingService, TrackingService>();
        services.AddScoped<IRendicionService, RendicionService>();

        return services;
    }
}
