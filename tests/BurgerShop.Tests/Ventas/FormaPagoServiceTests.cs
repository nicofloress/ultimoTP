using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Services;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces;
using Moq;
using System.Linq.Expressions;

namespace BurgerShop.Tests.Ventas;

public class FormaPagoServiceTests
{
    private readonly Mock<IRepository<FormaPago>> _repoMock;
    private readonly FormaPagoService _service;

    public FormaPagoServiceTests()
    {
        _repoMock = new Mock<IRepository<FormaPago>>();
        _service = new FormaPagoService(_repoMock.Object);
    }

    // -----------------------------------------------------------------------
    // GetAllAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetAllAsync_CuandoExistenFormas_RetornaListaDeFormaPagoDto()
    {
        // Arrange
        var formas = new List<FormaPago>
        {
            new() { Id = 1, Nombre = "Efectivo",       PorcentajeRecargo = 0m,  Activa = true  },
            new() { Id = 2, Nombre = "Tarjeta Débito",  PorcentajeRecargo = 5m,  Activa = true  },
            new() { Id = 3, Nombre = "Tarjeta Crédito", PorcentajeRecargo = 10m, Activa = false }
        };

        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(formas);

        // Act
        var result = await _service.GetAllAsync();

        // Assert
        var list = result.ToList();
        Assert.Equal(3, list.Count);
        Assert.Equal("Efectivo",       list[0].Nombre);
        Assert.Equal("Tarjeta Débito",  list[1].Nombre);
        Assert.Equal("Tarjeta Crédito", list[2].Nombre);
    }

    [Fact]
    public async Task GetAllAsync_CuandoNoExistenFormas_RetornaListaVacia()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<FormaPago>());

        // Act
        var result = await _service.GetAllAsync();

        // Assert
        Assert.Empty(result);
    }

    // -----------------------------------------------------------------------
    // GetByIdAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetByIdAsync_CuandoExiste_RetornaFormaPagoDto()
    {
        // Arrange
        var forma = new FormaPago { Id = 1, Nombre = "Efectivo", PorcentajeRecargo = 0m, Activa = true };
        _repoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(forma);

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1,          result.Id);
        Assert.Equal("Efectivo", result.Nombre);
        Assert.Equal(0m,         result.PorcentajeRecargo);
        Assert.True(result.Activa);
    }

    [Fact]
    public async Task GetByIdAsync_CuandoNoExiste_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((FormaPago?)null);

        // Act
        var result = await _service.GetByIdAsync(99);

        // Assert
        Assert.Null(result);
    }

    // -----------------------------------------------------------------------
    // GetActivasAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetActivasAsync_RetornaSoloFormasActivas()
    {
        // Arrange
        // FindAsync recibe una expresión: simulamos que el repo filtra y devuelve solo activas.
        var soloActivas = new List<FormaPago>
        {
            new() { Id = 1, Nombre = "Efectivo",      PorcentajeRecargo = 0m, Activa = true },
            new() { Id = 2, Nombre = "Tarjeta Débito", PorcentajeRecargo = 5m, Activa = true }
        };

        _repoMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<FormaPago, bool>>>()))
            .ReturnsAsync(soloActivas);

        // Act
        var result = await _service.GetActivasAsync();

        // Assert
        var list = result.ToList();
        Assert.Equal(2, list.Count);
        Assert.All(list, dto => Assert.True(dto.Activa));
    }

    [Fact]
    public async Task GetActivasAsync_CuandoNoHayActivas_RetornaListaVacia()
    {
        // Arrange
        _repoMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<FormaPago, bool>>>()))
            .ReturnsAsync(new List<FormaPago>());

        // Act
        var result = await _service.GetActivasAsync();

        // Assert
        Assert.Empty(result);
    }

    // -----------------------------------------------------------------------
    // CreateAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_ConDatosValidos_RetornaFormaPagoDtoCreado()
    {
        // Arrange
        var dto = new CrearFormaPagoDto("Mercado Pago", 3.5m, true);
        FormaPago? entidadCapturada = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<FormaPago>()))
            .Callback<FormaPago>(f =>
            {
                f.Id = 10; // Simula el Id asignado por la base de datos
                entidadCapturada = f;
            })
            .ReturnsAsync((FormaPago f) => f);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Mercado Pago", result.Nombre);
        Assert.Equal(3.5m,          result.PorcentajeRecargo);
        Assert.True(result.Activa);

        // Verificar que se llamó a AddAsync y SaveChangesAsync
        _repoMock.Verify(r => r.AddAsync(It.IsAny<FormaPago>()), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ConPorcentajeRecargoCero_CreaCorrectamente()
    {
        // Arrange
        var dto = new CrearFormaPagoDto("Efectivo", 0m, true);

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<FormaPago>()))
            .ReturnsAsync((FormaPago f) => f);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateAsync(dto);

        // Assert
        Assert.Equal(0m, result.PorcentajeRecargo);
    }

    // -----------------------------------------------------------------------
    // UpdateAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_CuandoExiste_ActualizaYRetornaDto()
    {
        // Arrange
        var formaExistente = new FormaPago { Id = 1, Nombre = "Efectivo", PorcentajeRecargo = 0m, Activa = true };
        var dto = new ActualizarFormaPagoDto("Efectivo Actualizado", 2m, false);

        _repoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(formaExistente);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.UpdateAsync(1, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Efectivo Actualizado", result.Nombre);
        Assert.Equal(2m,                     result.PorcentajeRecargo);
        Assert.False(result.Activa);

        _repoMock.Verify(r => r.Update(formaExistente), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_CuandoNoExiste_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((FormaPago?)null);

        var dto = new ActualizarFormaPagoDto("Cualquiera", 5m, true);

        // Act
        var result = await _service.UpdateAsync(99, dto);

        // Assert
        Assert.Null(result);

        // No se debe llamar a Update ni SaveChanges si la entidad no existe
        _repoMock.Verify(r => r.Update(It.IsAny<FormaPago>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    // -----------------------------------------------------------------------
    // DeleteAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_CuandoExiste_EliminaYRetornaTrue()
    {
        // Arrange
        var forma = new FormaPago { Id = 1, Nombre = "Efectivo", PorcentajeRecargo = 0m, Activa = true };

        _repoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(forma);

        _repoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.DeleteAsync(1);

        // Assert
        Assert.True(result);
        _repoMock.Verify(r => r.Remove(forma), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_CuandoNoExiste_RetornaFalse()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((FormaPago?)null);

        // Act
        var result = await _service.DeleteAsync(99);

        // Assert
        Assert.False(result);
        _repoMock.Verify(r => r.Remove(It.IsAny<FormaPago>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    // -----------------------------------------------------------------------
    // Mapeo ToDto
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetAllAsync_MapeaCorrectamenteTodosLosCampos()
    {
        // Arrange
        var formas = new List<FormaPago>
        {
            new() { Id = 42, Nombre = "QR",  PorcentajeRecargo = 7.5m, Activa = false }
        };

        _repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(formas);

        // Act
        var result = (await _service.GetAllAsync()).First();

        // Assert — verifica que cada campo del record FormaPagoDto se mapea correctamente
        Assert.Equal(42,    result.Id);
        Assert.Equal("QR",  result.Nombre);
        Assert.Equal(7.5m,  result.PorcentajeRecargo);
        Assert.False(result.Activa);
    }
}
