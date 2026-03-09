using BurgerShop.Application.Auth.DTOs;
using BurgerShop.Application.Auth.Interfaces;
using BurgerShop.Application.Auth.Services;
using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using Moq;

namespace BurgerShop.Tests.Auth;

/// <summary>
/// Tests unitarios para AuthService.
/// Cubre: LoginAsync (credenciales válidas, password incorrecta,
/// usuario inexistente, usuario inactivo) y GetUsuarioByIdAsync.
///
/// Nota: BCrypt.Net.BCrypt.HashPassword se usa en el Arrange de cada test
/// para generar el hash que el servicio verifica internamente con BCrypt.Verify.
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
    private readonly Mock<IJwtTokenGenerator>  _tokenGeneratorMock;
    private readonly AuthService               _service;

    public AuthServiceTests()
    {
        _usuarioRepoMock    = new Mock<IUsuarioRepository>();
        _tokenGeneratorMock = new Mock<IJwtTokenGenerator>();

        _service = new AuthService(_usuarioRepoMock.Object, _tokenGeneratorMock.Object);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Construye un Usuario activo con el hash BCrypt de la contraseña dada.
    /// </summary>
    private static Usuario BuildUsuarioActivo(
        int id = 1,
        string nombreUsuario = "admin",
        string password = "secret123",
        RolUsuario rol = RolUsuario.Administrador,
        int? repartidorId = null)
    {
        return new Usuario
        {
            Id             = id,
            NombreUsuario  = nombreUsuario,
            PasswordHash   = BCrypt.Net.BCrypt.HashPassword(password),
            NombreCompleto = "Usuario Test",
            Rol            = rol,
            RepartidorId   = repartidorId,
            Activo         = true
        };
    }

    // -----------------------------------------------------------------------
    // Tests: LoginAsync — camino feliz
    // -----------------------------------------------------------------------

    [Fact]
    public async Task LoginAsync_CredencialesValidas_RetornaLoginResultDtoConToken()
    {
        // Arrange
        const string password    = "secret123";
        const string tokenEsperado = "jwt.token.generado";

        var usuario = BuildUsuarioActivo(password: password);

        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync(usuario.NombreUsuario))
            .ReturnsAsync(usuario);

        _tokenGeneratorMock
            .Setup(t => t.GenerateToken(usuario.Id, usuario.NombreCompleto,
                                        RolUsuario.Administrador.ToString(), null))
            .Returns(tokenEsperado);

        var dto = new LoginDto { NombreUsuario = usuario.NombreUsuario, Password = password };

        // Act
        var resultado = await _service.LoginAsync(dto);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(tokenEsperado, resultado!.Token);
        Assert.NotNull(resultado.Usuario);
        Assert.Equal(usuario.Id,            resultado.Usuario.Id);
        Assert.Equal(usuario.NombreUsuario,  resultado.Usuario.NombreUsuario);
        Assert.Equal(RolUsuario.Administrador, resultado.Usuario.Rol);
    }

    [Fact]
    public async Task LoginAsync_CredencialesValidas_UsuarioDtoContieneRolNombreCorrecto()
    {
        // Arrange
        const string password = "clave";
        var usuario = BuildUsuarioActivo(rol: RolUsuario.Local, password: password);

        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync(usuario.NombreUsuario))
            .ReturnsAsync(usuario);

        _tokenGeneratorMock
            .Setup(t => t.GenerateToken(It.IsAny<int>(), It.IsAny<string>(),
                                        It.IsAny<string>(), It.IsAny<int?>()))
            .Returns("token");

        var dto = new LoginDto { NombreUsuario = usuario.NombreUsuario, Password = password };

        // Act
        var resultado = await _service.LoginAsync(dto);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(RolUsuario.Local.ToString(), resultado!.Usuario.RolNombre);
        Assert.Equal(RolUsuario.Local,            resultado.Usuario.Rol);
    }

    [Fact]
    public async Task LoginAsync_CredencialesValidas_LlamaAGenerateTokenConParametrosCorrectos()
    {
        // Arrange
        const string password     = "pass";
        const int    repartidorId = 7;

        var usuario = BuildUsuarioActivo(
            id: 42, rol: RolUsuario.Repartidor,
            password: password, repartidorId: repartidorId);

        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync(usuario.NombreUsuario))
            .ReturnsAsync(usuario);

        _tokenGeneratorMock
            .Setup(t => t.GenerateToken(It.IsAny<int>(), It.IsAny<string>(),
                                        It.IsAny<string>(), It.IsAny<int?>()))
            .Returns("token");

        var dto = new LoginDto { NombreUsuario = usuario.NombreUsuario, Password = password };

        // Act
        await _service.LoginAsync(dto);

        // Assert: el generador recibe los valores correctos del usuario
        _tokenGeneratorMock.Verify(t => t.GenerateToken(
            42,
            usuario.NombreCompleto,
            RolUsuario.Repartidor.ToString(),
            repartidorId), Times.Once);
    }

    // -----------------------------------------------------------------------
    // Tests: LoginAsync — casos de fallo
    // -----------------------------------------------------------------------

    [Fact]
    public async Task LoginAsync_PasswordIncorrecta_RetornaNull()
    {
        // Arrange
        var usuario = BuildUsuarioActivo(password: "clave-correcta");

        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync(usuario.NombreUsuario))
            .ReturnsAsync(usuario);

        var dto = new LoginDto
        {
            NombreUsuario = usuario.NombreUsuario,
            Password      = "clave-INCORRECTA"
        };

        // Act
        var resultado = await _service.LoginAsync(dto);

        // Assert
        Assert.Null(resultado);
        // El token no debe generarse si la autenticación falla
        _tokenGeneratorMock.Verify(t => t.GenerateToken(
            It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_UsuarioInexistente_RetornaNull()
    {
        // Arrange
        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync("noexiste"))
            .ReturnsAsync((Usuario?)null);

        var dto = new LoginDto { NombreUsuario = "noexiste", Password = "cualquiera" };

        // Act
        var resultado = await _service.LoginAsync(dto);

        // Assert
        Assert.Null(resultado);
        _tokenGeneratorMock.Verify(t => t.GenerateToken(
            It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<int?>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_UsuarioInactivo_RetornaNull()
    {
        // Arrange
        const string password = "pass";
        var usuario = BuildUsuarioActivo(password: password);
        usuario.Activo = false;   // <— usuario deshabilitado

        _usuarioRepoMock
            .Setup(r => r.GetByNombreUsuarioAsync(usuario.NombreUsuario))
            .ReturnsAsync(usuario);

        var dto = new LoginDto { NombreUsuario = usuario.NombreUsuario, Password = password };

        // Act
        var resultado = await _service.LoginAsync(dto);

        // Assert
        Assert.Null(resultado);
        _tokenGeneratorMock.Verify(t => t.GenerateToken(
            It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<int?>()), Times.Never);
    }

    // -----------------------------------------------------------------------
    // Tests: GetUsuarioByIdAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetUsuarioByIdAsync_IdValido_RetornaUsuarioDto()
    {
        // Arrange
        var usuario = BuildUsuarioActivo(id: 5, rol: RolUsuario.Administrador);

        _usuarioRepoMock
            .Setup(r => r.GetByIdActivoAsync(5))
            .ReturnsAsync(usuario);

        // Act
        var resultado = await _service.GetUsuarioByIdAsync(5);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(5,                       resultado!.Id);
        Assert.Equal(usuario.NombreUsuario,    resultado.NombreUsuario);
        Assert.Equal(usuario.NombreCompleto,   resultado.NombreCompleto);
        Assert.Equal(RolUsuario.Administrador, resultado.Rol);
        Assert.Equal("Administrador",          resultado.RolNombre);
    }

    [Fact]
    public async Task GetUsuarioByIdAsync_IdInexistente_RetornaNull()
    {
        // Arrange
        _usuarioRepoMock
            .Setup(r => r.GetByIdActivoAsync(999))
            .ReturnsAsync((Usuario?)null);

        // Act
        var resultado = await _service.GetUsuarioByIdAsync(999);

        // Assert
        Assert.Null(resultado);
    }

    [Fact]
    public async Task GetUsuarioByIdAsync_UsuarioConRepartidorId_MapeoEsCorrecto()
    {
        // Arrange
        var usuario = BuildUsuarioActivo(id: 10, rol: RolUsuario.Repartidor, repartidorId: 3);

        _usuarioRepoMock
            .Setup(r => r.GetByIdActivoAsync(10))
            .ReturnsAsync(usuario);

        // Act
        var resultado = await _service.GetUsuarioByIdAsync(10);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(3,                    resultado!.RepartidorId);
        Assert.Equal(RolUsuario.Repartidor, resultado.Rol);
    }
}
