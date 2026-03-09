using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Services;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces;
using Moq;

namespace BurgerShop.Tests.Catalogo;

/// <summary>
/// Tests unitarios para ProveedorService.
/// Cubre: GetAllAsync, GetByIdAsync, CreateAsync, UpdateAsync y DeleteAsync (soft-delete).
/// </summary>
public class ProveedorServiceTests
{
    private readonly Mock<IRepository<Proveedor>> _repoMock;
    private readonly ProveedorService             _service;

    public ProveedorServiceTests()
    {
        _repoMock = new Mock<IRepository<Proveedor>>();
        _service  = new ProveedorService(_repoMock.Object);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private static Proveedor BuildProveedor(
        int id = 1,
        string nombre = "Proveedor Test",
        bool activo = true) =>
        new Proveedor
        {
            Id        = id,
            Nombre    = nombre,
            Contacto  = "contacto@test.com",
            Telefono  = "011-1234-5678",
            Direccion = "Calle Falsa 123",
            Activo    = activo
        };

    // -----------------------------------------------------------------------
    // Tests: GetAllAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetAllAsync_HayProveedores_RetornaListaMapeada()
    {
        // Arrange
        var proveedores = new List<Proveedor>
        {
            BuildProveedor(id: 1, nombre: "Proveedor A"),
            BuildProveedor(id: 2, nombre: "Proveedor B"),
            BuildProveedor(id: 3, nombre: "Proveedor C")
        };

        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(proveedores);

        // Act
        var resultado = await _service.GetAllAsync();

        // Assert
        var lista = resultado.ToList();
        Assert.Equal(3, lista.Count);
        Assert.Equal("Proveedor A", lista[0].Nombre);
        Assert.Equal("Proveedor B", lista[1].Nombre);
        Assert.Equal("Proveedor C", lista[2].Nombre);
    }

    [Fact]
    public async Task GetAllAsync_ListaVacia_RetornaEnumerableVacio()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Proveedor>());

        // Act
        var resultado = await _service.GetAllAsync();

        // Assert
        Assert.Empty(resultado);
    }

    [Fact]
    public async Task GetAllAsync_MapeoEsCorrecto_TodosLosCamposSeMapeanan()
    {
        // Arrange
        var proveedor = BuildProveedor(id: 5, nombre: "Dist. Central", activo: true);
        proveedor.Contacto  = "Juan";
        proveedor.Telefono  = "011-9999";
        proveedor.Direccion = "Av. Siempreviva 742";

        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Proveedor> { proveedor });

        // Act
        var resultado = (await _service.GetAllAsync()).ToList();

        // Assert
        Assert.Single(resultado);
        var dto = resultado[0];
        Assert.Equal(5,                    dto.Id);
        Assert.Equal("Dist. Central",      dto.Nombre);
        Assert.Equal("Juan",               dto.Contacto);
        Assert.Equal("011-9999",           dto.Telefono);
        Assert.Equal("Av. Siempreviva 742", dto.Direccion);
        Assert.True(dto.Activo);
    }

    // -----------------------------------------------------------------------
    // Tests: GetByIdAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetByIdAsync_IdValido_RetornaProveedorDto()
    {
        // Arrange
        var proveedor = BuildProveedor(id: 10, nombre: "Carnes del Sur");

        _repoMock
            .Setup(r => r.GetByIdAsync(10))
            .ReturnsAsync(proveedor);

        // Act
        var resultado = await _service.GetByIdAsync(10);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(10,              resultado!.Id);
        Assert.Equal("Carnes del Sur", resultado.Nombre);
    }

    [Fact]
    public async Task GetByIdAsync_IdInexistente_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((Proveedor?)null);

        // Act
        var resultado = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(resultado);
    }

    // -----------------------------------------------------------------------
    // Tests: CreateAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_DtoValido_CreaProveedorYRetornaDto()
    {
        // Arrange
        var dto = new CrearProveedorDto
        {
            Nombre    = "Nuevo Proveedor",
            Contacto  = "Maria",
            Telefono  = "011-1111",
            Direccion = "Belgrano 100"
        };

        Proveedor? proveedorGuardado = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Proveedor>()))
            .Callback<Proveedor>(p => proveedorGuardado = p)
            .ReturnsAsync((Proveedor p) => p);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var resultado = await _service.CreateAsync(dto);

        // Assert: el DTO retornado refleja los datos del dto de creación
        Assert.NotNull(resultado);
        Assert.Equal("Nuevo Proveedor", resultado.Nombre);
        Assert.Equal("Maria",           resultado.Contacto);
        Assert.Equal("011-1111",        resultado.Telefono);
        Assert.Equal("Belgrano 100",    resultado.Direccion);
    }

    [Fact]
    public async Task CreateAsync_DtoValido_LlamaAddAsyncYSaveChanges()
    {
        // Arrange
        var dto = new CrearProveedorDto { Nombre = "Proveedor X" };

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Proveedor>()))
            .ReturnsAsync((Proveedor p) => p);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Proveedor>()), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(),               Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DtoValido_EntidadCreadaConCamposCorrectos()
    {
        // Arrange
        var dto = new CrearProveedorDto
        {
            Nombre    = "Lácteos Norte",
            Contacto  = "Pedro",
            Telefono  = "0341-555-1234",
            Direccion = "Ruta 9 km 50"
        };

        Proveedor? capturado = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Proveedor>()))
            .Callback<Proveedor>(p => capturado = p)
            .ReturnsAsync((Proveedor p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert: la entidad pasada al repositorio tiene los valores correctos
        Assert.NotNull(capturado);
        Assert.Equal("Lácteos Norte",   capturado!.Nombre);
        Assert.Equal("Pedro",           capturado.Contacto);
        Assert.Equal("0341-555-1234",   capturado.Telefono);
        Assert.Equal("Ruta 9 km 50",    capturado.Direccion);
    }

    // -----------------------------------------------------------------------
    // Tests: UpdateAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_IdValido_ActualizaYRetornaDto()
    {
        // Arrange
        var proveedorExistente = BuildProveedor(id: 3, nombre: "Nombre Viejo");

        _repoMock
            .Setup(r => r.GetByIdAsync(3))
            .ReturnsAsync(proveedorExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProveedorDto
        {
            Nombre    = "Nombre Nuevo",
            Contacto  = "Contacto Nuevo",
            Telefono  = "011-9999",
            Direccion = "Nueva Dir 456"
        };

        // Act
        var resultado = await _service.UpdateAsync(3, dto);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal("Nombre Nuevo",   resultado!.Nombre);
        Assert.Equal("Contacto Nuevo", resultado.Contacto);
        Assert.Equal("011-9999",       resultado.Telefono);
        Assert.Equal("Nueva Dir 456",  resultado.Direccion);
    }

    [Fact]
    public async Task UpdateAsync_IdValido_LlamaUpdateYSaveChanges()
    {
        // Arrange
        var proveedorExistente = BuildProveedor(id: 3);

        _repoMock
            .Setup(r => r.GetByIdAsync(3))
            .ReturnsAsync(proveedorExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProveedorDto { Nombre = "Actualizado" };

        // Act
        await _service.UpdateAsync(3, dto);

        // Assert
        _repoMock.Verify(r => r.Update(proveedorExistente), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(),          Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_IdInexistente_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(404))
            .ReturnsAsync((Proveedor?)null);

        var dto = new ActualizarProveedorDto { Nombre = "No importa" };

        // Act
        var resultado = await _service.UpdateAsync(404, dto);

        // Assert
        Assert.Null(resultado);
        // No debe intentar guardar si no existe
        _repoMock.Verify(r => r.Update(It.IsAny<Proveedor>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(),             Times.Never);
    }

    // -----------------------------------------------------------------------
    // Tests: DeleteAsync (soft-delete)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_IdValido_MarcaActivoFalse()
    {
        // Arrange
        var proveedor = BuildProveedor(id: 5, activo: true);

        _repoMock
            .Setup(r => r.GetByIdAsync(5))
            .ReturnsAsync(proveedor);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var resultado = await _service.DeleteAsync(5);

        // Assert: el soft-delete pone Activo = false
        Assert.True(resultado);
        Assert.False(proveedor.Activo);
    }

    [Fact]
    public async Task DeleteAsync_IdValido_LlamaUpdateYSaveChanges()
    {
        // Arrange
        var proveedor = BuildProveedor(id: 5);

        _repoMock
            .Setup(r => r.GetByIdAsync(5))
            .ReturnsAsync(proveedor);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.DeleteAsync(5);

        // Assert
        _repoMock.Verify(r => r.Update(proveedor), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_IdInexistente_RetornaFalse()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((Proveedor?)null);

        // Act
        var resultado = await _service.DeleteAsync(999);

        // Assert
        Assert.False(resultado);
        // No debe actualizar ni guardar si no existe el proveedor
        _repoMock.Verify(r => r.Update(It.IsAny<Proveedor>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(),             Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ProveedorYaInactivo_SeMarcaInactivoIgualmente()
    {
        // Arrange: el proveedor ya estaba inactivo; la operación es idempotente
        var proveedor = BuildProveedor(id: 6, activo: false);

        _repoMock
            .Setup(r => r.GetByIdAsync(6))
            .ReturnsAsync(proveedor);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var resultado = await _service.DeleteAsync(6);

        // Assert
        Assert.True(resultado);
        Assert.False(proveedor.Activo);
    }
}
