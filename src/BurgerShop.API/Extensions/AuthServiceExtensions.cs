using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Application.Auth.Services;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Auth;
using BurgerShop.Infrastructure.Repositories.Auth;

namespace BurgerShop.API.Extensions;

public static class AuthServiceExtensions
{
    public static IServiceCollection AddAuthServices(this IServiceCollection services)
    {
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        return services;
    }
}
