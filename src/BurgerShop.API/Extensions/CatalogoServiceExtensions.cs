using BurgerShop.Application.Catalogo.Interfaces;
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

        // Services
        services.AddScoped<ICategoriaService, CategoriaService>();
        services.AddScoped<IProductoService, ProductoService>();
        services.AddScoped<IComboService, ComboService>();
        services.AddScoped<IProveedorService, ProveedorService>();
        services.AddScoped<IListaPrecioService, ListaPrecioService>();

        return services;
    }
}
