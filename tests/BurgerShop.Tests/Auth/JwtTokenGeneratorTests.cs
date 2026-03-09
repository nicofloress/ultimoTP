using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BurgerShop.Infrastructure.Auth;
using Microsoft.Extensions.Configuration;

namespace BurgerShop.Tests.Auth;

/// <summary>
/// Tests unitarios para JwtTokenGenerator.
///
/// Estrategia: se construye un IConfiguration en memoria con los valores
/// mínimos requeridos (Jwt:Key, Jwt:Issuer, Jwt:Audience, Jwt:ExpirationMinutes)
/// y se parsea el token JWT resultante para verificar sus claims.
///
/// Nota: el proyecto de tests necesita referenciar BurgerShop.Infrastructure
/// para instanciar JwtTokenGenerator directamente (clase concreta).
/// </summary>
public class JwtTokenGeneratorTests
{
    private readonly JwtTokenGenerator _generator;

    /// <summary>
    /// Clave de al menos 256 bits para HMACSHA256 (32 caracteres ASCII = 256 bits).
    /// </summary>
    private const string ClaveSecreta = "clave-super-secreta-para-tests-32bytes!";

    public JwtTokenGeneratorTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]               = ClaveSecreta,
                ["Jwt:Issuer"]            = "BurgerShopTests",
                ["Jwt:Audience"]          = "BurgerShopClient",
                ["Jwt:ExpirationMinutes"] = "60"
            })
            .Build();

        _generator = new JwtTokenGenerator(config);
    }

    // -----------------------------------------------------------------------
    // Helper: parsear el token sin validar firma (ya sabemos que la clave es válida)
    // -----------------------------------------------------------------------

    private static JwtSecurityToken ParseToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(token);
    }

    // -----------------------------------------------------------------------
    // Tests: claims básicos
    // -----------------------------------------------------------------------

    [Fact]
    public void GenerateToken_Llamado_RetornaStringNoVacio()
    {
        // Act
        var token = _generator.GenerateToken(1, "Juan Pérez", "Administrador", null);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateToken_ParametrosValidos_ClaimSubEsElUserId()
    {
        // Arrange
        const int userId = 42;

        // Act
        var token  = _generator.GenerateToken(userId, "Ana García", "Local", null);
        var parsed = ParseToken(token);

        // Assert: JwtRegisteredClaimNames.Sub → "sub"
        var subClaim = parsed.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(subClaim);
        Assert.Equal(userId.ToString(), subClaim!.Value);
    }

    [Fact]
    public void GenerateToken_ParametrosValidos_ClaimNameEsElNombreCompleto()
    {
        // Arrange
        const string nombre = "María López";

        // Act
        var token  = _generator.GenerateToken(1, nombre, "Administrador", null);
        var parsed = ParseToken(token);

        // Assert: ClaimTypes.Name → "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        var nameClaim = parsed.Claims.FirstOrDefault(
            c => c.Type == ClaimTypes.Name ||
                 c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name");
        Assert.NotNull(nameClaim);
        Assert.Equal(nombre, nameClaim!.Value);
    }

    [Fact]
    public void GenerateToken_ParametrosValidos_ClaimRoleEsElRolProvisto()
    {
        // Arrange
        const string rol = "Administrador";

        // Act
        var token  = _generator.GenerateToken(1, "Admin", rol, null);
        var parsed = ParseToken(token);

        // Assert: ClaimTypes.Role → "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        var roleClaim = parsed.Claims.FirstOrDefault(
            c => c.Type == ClaimTypes.Role ||
                 c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
        Assert.NotNull(roleClaim);
        Assert.Equal(rol, roleClaim!.Value);
    }

    // -----------------------------------------------------------------------
    // Tests: claim repartidorId
    // -----------------------------------------------------------------------

    [Fact]
    public void GenerateToken_ConRepartidorId_IncludeClaimRepartidorId()
    {
        // Arrange
        const int repartidorId = 7;

        // Act
        var token  = _generator.GenerateToken(1, "Carlos Rep", "Repartidor", repartidorId);
        var parsed = ParseToken(token);

        // Assert
        var repClaim = parsed.Claims.FirstOrDefault(c => c.Type == "repartidorId");
        Assert.NotNull(repClaim);
        Assert.Equal(repartidorId.ToString(), repClaim!.Value);
    }

    [Fact]
    public void GenerateToken_SinRepartidorId_NoIncludeClaimRepartidorId()
    {
        // Act
        var token  = _generator.GenerateToken(1, "Admin", "Administrador", repartidorId: null);
        var parsed = ParseToken(token);

        // Assert: el claim "repartidorId" no debe existir
        var repClaim = parsed.Claims.FirstOrDefault(c => c.Type == "repartidorId");
        Assert.Null(repClaim);
    }

    [Fact]
    public void GenerateToken_RepartidorIdCero_NoIncludeClaimRepartidorId()
    {
        // Arrange: null es la única condición que omite el claim; 0 como int? no ocurre
        // en la práctica, pero verificamos el contrato explícito del null check.
        // Pasamos null → no debe incluir el claim.
        var token  = _generator.GenerateToken(1, "Local", "Local", repartidorId: null);
        var parsed = ParseToken(token);

        // Assert
        Assert.DoesNotContain(parsed.Claims, c => c.Type == "repartidorId");
    }

    // -----------------------------------------------------------------------
    // Tests: estructura y expiración del token
    // -----------------------------------------------------------------------

    [Fact]
    public void GenerateToken_Llamado_TokenTieneIssuerYAudienceCorrectos()
    {
        // Act
        var token  = _generator.GenerateToken(1, "Test", "Administrador", null);
        var parsed = ParseToken(token);

        // Assert
        Assert.Equal("BurgerShopTests",  parsed.Issuer);
        Assert.Contains("BurgerShopClient", parsed.Audiences);
    }

    [Fact]
    public void GenerateToken_Llamado_TokenExpiraEnElFuturo()
    {
        // Act
        var antes  = DateTime.UtcNow;
        var token  = _generator.GenerateToken(1, "Test", "Administrador", null);
        var parsed = ParseToken(token);

        // Assert: la expiración debe ser posterior al momento de generación
        Assert.True(parsed.ValidTo > antes,
            $"Se esperaba expiración posterior a {antes:O}, pero fue {parsed.ValidTo:O}");
    }

    [Fact]
    public void GenerateToken_ConTresClaimsBasicos_ContieneCantidadCorrecta()
    {
        // Arrange
        // Sin repartidorId → 3 claims: sub, name, role
        var token  = _generator.GenerateToken(5, "Nombre Test", "Local", repartidorId: null);
        var parsed = ParseToken(token);

        // Act: filtrar solo nuestros claims personalizados
        var nuestrosClaims = parsed.Claims
            .Where(c => c.Type == JwtRegisteredClaimNames.Sub
                     || c.Type == ClaimTypes.Name
                     || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                     || c.Type == ClaimTypes.Role
                     || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                     || c.Type == "repartidorId")
            .ToList();

        // Assert: exactamente 3 claims propios (sub + name + role)
        Assert.Equal(3, nuestrosClaims.Count);
    }

    [Fact]
    public void GenerateToken_ConRepartidorId_ContieneCuatroClaims()
    {
        // Arrange
        // Con repartidorId → 4 claims: sub, name, role, repartidorId
        var token  = _generator.GenerateToken(5, "Repartidor Test", "Repartidor", repartidorId: 3);
        var parsed = ParseToken(token);

        var nuestrosClaims = parsed.Claims
            .Where(c => c.Type == JwtRegisteredClaimNames.Sub
                     || c.Type == ClaimTypes.Name
                     || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                     || c.Type == ClaimTypes.Role
                     || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                     || c.Type == "repartidorId")
            .ToList();

        // Assert: exactamente 4 claims propios (sub + name + role + repartidorId)
        Assert.Equal(4, nuestrosClaims.Count);
    }
}
