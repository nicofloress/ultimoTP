using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Inventario.Services;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Infrastructure.Repositories.Inventario;

namespace BurgerShop.API.Extensions;

public static class InventarioServiceExtensions
{
    public static IServiceCollection AddInventarioServices(this IServiceCollection services)
    {
        // Repositorios
        services.AddScoped<IMovimientoRepository, MovimientoRepository>();
        services.AddScoped<IArtiStockRepository, ArtiStockRepository>();

        // Servicios
        services.AddScoped<ILocalService, LocalService>();
        services.AddScoped<IMovimientoService, MovimientoService>();
        services.AddScoped<IArtiStockService, ArtiStockService>();

        return services;
    }
}
