using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Application.Ventas.Services;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Ventas;
using BurgerShop.Infrastructure.Repositories;
using BurgerShop.Infrastructure.Repositories.Ventas;

namespace BurgerShop.API.Extensions;

public static class VentasServiceExtensions
{
    public static IServiceCollection AddVentasServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IPedidoRepository, PedidoRepository>();
        services.AddScoped<IRepository<FormaPago>, Repository<FormaPago>>();
        services.AddScoped<IRepository<TipoCliente>, Repository<TipoCliente>>();
        services.AddScoped<IClienteRepository, ClienteRepository>();

        // Services
        services.AddScoped<IPedidoService, PedidoService>();
        services.AddScoped<IFormaPagoService, FormaPagoService>();
        services.AddScoped<ITipoClienteService, TipoClienteService>();
        services.AddScoped<IClienteService, ClienteService>();

        return services;
    }
}
