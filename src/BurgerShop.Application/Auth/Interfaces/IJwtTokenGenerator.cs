namespace BurgerShop.Application.Auth.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(int userId, string nombre, string rol, int? repartidorId);
}
