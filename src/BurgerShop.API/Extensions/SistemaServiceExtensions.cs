using BurgerShop.Application.Sistema.Interfaces;
using BurgerShop.Application.Sistema.Services;
using BurgerShop.Domain.Interfaces.Sistema;
using BurgerShop.Infrastructure.Repositories.Sistema;

namespace BurgerShop.API.Extensions;

public static class SistemaServiceExtensions
{
    public static IServiceCollection AddSistemaServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<ILogEntryRepository, LogEntryRepository>();

        // Services
        services.AddScoped<ILogService, LogService>();

        return services;
    }
}
