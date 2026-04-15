using BurgerShop.Application.Dashboard.Interfaces;
using BurgerShop.Application.Dashboard.Services;

namespace BurgerShop.API.Extensions;

public static class DashboardServiceExtensions
{
    public static IServiceCollection AddDashboardServices(this IServiceCollection services)
    {
        services.AddScoped<IDashboardService, DashboardService>();
        return services;
    }
}
