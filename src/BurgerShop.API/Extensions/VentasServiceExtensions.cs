using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Application.Ventas.Services;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Repositories.Ventas;

namespace BurgerShop.API.Extensions;

public static class VentasServiceExtensions
{
    public static IServiceCollection AddVentasServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IPedidoRepository, PedidoRepository>();

        // Services
        services.AddScoped<IPedidoService, PedidoService>();

        return services;
    }
}
