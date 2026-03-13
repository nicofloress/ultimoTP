using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Services;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;
using Moq;

namespace BurgerShop.Tests.Catalogo;

/// <summary>
/// Tests unitarios para ProductoService.
/// Foco: mapeo correcto de los campos Marca (string? nullable) y UnidadesPorMedia (int)
/// en CreateAsync y UpdateAsync, y cobertura de GetByIdAsync y DeleteAsync.
/// </summary>
public class ProductoServiceTests
{
    private readonly Mock<IProductoRepository>    _repoMock;
    private readonly Mock<IListaPrecioRepository> _listaPrecioRepoMock;
    private readonly ProductoService              _service;

    public ProductoServiceTests()
    {
        _repoMock            = new Mock<IProductoRepository>();
        _listaPrecioRepoMock = new Mock<IListaPrecioRepository>();
        _service             = new ProductoService(_repoMock.Object, _listaPrecioRepoMock.Object);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Construye un Producto de prueba con todos los campos relevantes.
    /// La propiedad de navegación Categoria se deja en null porque el repositorio
    /// real hace el join; en tests que sólo comprueban mapeo de Marca/UnidadesPorMedia
    /// no importa el nombre de la categoría.
    /// </summary>
    private static Producto BuildProducto(
        int     id               = 1,
        string  nombre           = "Hamburguesa Test",
        decimal precio           = 1500m,
        int     categoriaId      = 1,
        bool    activo           = true,
        string? marca            = null,
        int     unidadesPorMedia = 0,
        int     unidadesPorBulto = 1) =>
        new Producto
        {
            Id               = id,
            Nombre           = nombre,
            Descripcion      = "Descripción de prueba",
            Precio           = precio,
            CategoriaId      = categoriaId,
            Activo           = activo,
            ImagenUrl        = null,
            NumeroInterno    = "P001",
            PesoGramos       = 200,
            UnidadesPorBulto = unidadesPorBulto,
            Marca            = marca,
            UnidadesPorMedia = unidadesPorMedia
        };

    // -----------------------------------------------------------------------
    // Tests: CreateAsync — mapeo de Marca y UnidadesPorMedia
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_ConMarcaYUnidadesPorMedia_MapeaAmbosEnEntidad()
    {
        // Arrange
        var dto = new CrearProductoDto(
            Nombre:           "Pan Brioche",
            Descripcion:      "Pan artesanal",
            Precio:           800m,
            CategoriaId:      2,
            ImagenUrl:        null,
            NumeroInterno:    "PAN-001",
            PesoGramos:       150,
            UnidadesPorBulto: 10,
            Marca:            "La Especial",
            UnidadesPorMedia: 5);

        Producto? capturado = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .Callback<Producto>(p => capturado = p)
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert: la entidad enviada al repositorio tiene Marca y UnidadesPorMedia
        Assert.NotNull(capturado);
        Assert.Equal("La Especial", capturado!.Marca);
        Assert.Equal(5,             capturado.UnidadesPorMedia);
    }

    [Fact]
    public async Task CreateAsync_ConMarcaYUnidadesPorMedia_RetornaDtoConAmbosCampos()
    {
        // Arrange
        var dto = new CrearProductoDto(
            Nombre:           "Queso Cheddar",
            Descripcion:      null,
            Precio:           2200m,
            CategoriaId:      3,
            ImagenUrl:        null,
            NumeroInterno:    "QUE-001",
            PesoGramos:       500,
            UnidadesPorBulto: 24,
            Marca:            "Cremona",
            UnidadesPorMedia: 12);

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var resultado = await _service.CreateAsync(dto);

        // Assert: el DTO retornado refleja exactamente los valores del dto de entrada
        Assert.Equal("Cremona", resultado.Marca);
        Assert.Equal(12,        resultado.UnidadesPorMedia);
    }

    [Fact]
    public async Task CreateAsync_MarcaNull_EntidadSeGuardaConMarcaNull()
    {
        // Arrange: Marca es opcional; omitirla debe resultar en null en la entidad
        var dto = new CrearProductoDto(
            Nombre:           "Coca-Cola 500ml",
            Descripcion:      "Bebida",
            Precio:           600m,
            CategoriaId:      4,
            ImagenUrl:        null,
            NumeroInterno:    "BEB-001",
            PesoGramos:       null,
            UnidadesPorBulto: 24,
            Marca:            null,       // explícitamente null
            UnidadesPorMedia: 0);

        Producto? capturado = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .Callback<Producto>(p => capturado = p)
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(capturado);
        Assert.Null(capturado!.Marca);
    }

    [Fact]
    public async Task CreateAsync_MarcaNull_RetornaDtoConMarcaNull()
    {
        // Arrange
        var dto = new CrearProductoDto(
            Nombre:           "Agua Mineral",
            Descripcion:      null,
            Precio:           300m,
            CategoriaId:      4,
            ImagenUrl:        null,
            NumeroInterno:    "BEB-002",
            PesoGramos:       null,
            UnidadesPorBulto: 1,
            Marca:            null,
            UnidadesPorMedia: 0);

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var resultado = await _service.CreateAsync(dto);

        // Assert
        Assert.Null(resultado.Marca);
        Assert.Equal(0, resultado.UnidadesPorMedia);
    }

    [Fact]
    public async Task CreateAsync_UnidadesPorMediaCero_EntidadConUnidadesPorMediaCero()
    {
        // Arrange: valor de borde — 0 es el default para UnidadesPorMedia
        var dto = new CrearProductoDto(
            Nombre:           "Papas Fritas",
            Descripcion:      "Acompañamiento",
            Precio:           400m,
            CategoriaId:      3,
            ImagenUrl:        null,
            NumeroInterno:    "ACA-001",
            PesoGramos:       150,
            UnidadesPorBulto: 1,
            Marca:            "McCain",
            UnidadesPorMedia: 0);

        Producto? capturado = null;

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .Callback<Producto>(p => capturado = p)
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(capturado);
        Assert.Equal("McCain", capturado!.Marca);
        Assert.Equal(0,        capturado.UnidadesPorMedia);
    }

    [Fact]
    public async Task CreateAsync_DtoValido_LlamaAddAsyncYSaveChangesUnaVezCadaUno()
    {
        // Arrange
        var dto = new CrearProductoDto(
            Nombre:           "Producto X",
            Descripcion:      null,
            Precio:           100m,
            CategoriaId:      1,
            ImagenUrl:        null,
            NumeroInterno:    null);

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Producto>()))
            .ReturnsAsync((Producto p) => p);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Producto>()), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(),              Times.Once);
    }

    // -----------------------------------------------------------------------
    // Tests: UpdateAsync — mapeo de Marca y UnidadesPorMedia
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_ConMarcaYUnidadesPorMedia_ActualizaAmbosEnEntidad()
    {
        // Arrange: producto existente sin marca ni unidades
        var productoExistente = BuildProducto(id: 7, marca: null, unidadesPorMedia: 0);

        _repoMock
            .Setup(r => r.GetByIdAsync(7))
            .ReturnsAsync(productoExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProductoDto(
            Nombre:           productoExistente.Nombre,
            Descripcion:      productoExistente.Descripcion,
            Precio:           productoExistente.Precio,
            CategoriaId:      productoExistente.CategoriaId,
            Activo:           true,
            ImagenUrl:        null,
            NumeroInterno:    "P001",
            PesoGramos:       200,
            UnidadesPorBulto: 1,
            Marca:            "Fargo",
            UnidadesPorMedia: 6);

        // Act
        var resultado = await _service.UpdateAsync(7, dto);

        // Assert: la entidad fue modificada con los nuevos valores
        Assert.NotNull(resultado);
        Assert.Equal("Fargo", productoExistente.Marca);
        Assert.Equal(6,       productoExistente.UnidadesPorMedia);
    }

    [Fact]
    public async Task UpdateAsync_ConMarcaYUnidadesPorMedia_RetornaDtoConAmbosCamposActualizados()
    {
        // Arrange
        var productoExistente = BuildProducto(id: 8, marca: "MarcaVieja", unidadesPorMedia: 3);

        _repoMock
            .Setup(r => r.GetByIdAsync(8))
            .ReturnsAsync(productoExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProductoDto(
            Nombre:           "Hamburguesa Doble",
            Descripcion:      "Nueva descripción",
            Precio:           2500m,
            CategoriaId:      1,
            Activo:           true,
            ImagenUrl:        null,
            NumeroInterno:    "P001",
            PesoGramos:       300,
            UnidadesPorBulto: 1,
            Marca:            "MarcaNueva",
            UnidadesPorMedia: 8);

        // Act
        var resultado = await _service.UpdateAsync(8, dto);

        // Assert: el DTO retornado refleja los valores actualizados
        Assert.NotNull(resultado);
        Assert.Equal("MarcaNueva", resultado!.Marca);
        Assert.Equal(8,            resultado.UnidadesPorMedia);
    }

    [Fact]
    public async Task UpdateAsync_MarcaSetNull_ProductoActualizaMarcaANull()
    {
        // Arrange: producto tiene marca y se actualiza a null (se elimina la marca)
        var productoExistente = BuildProducto(id: 9, marca: "MarcaAnterior", unidadesPorMedia: 5);

        _repoMock
            .Setup(r => r.GetByIdAsync(9))
            .ReturnsAsync(productoExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProductoDto(
            Nombre:           productoExistente.Nombre,
            Descripcion:      productoExistente.Descripcion,
            Precio:           productoExistente.Precio,
            CategoriaId:      productoExistente.CategoriaId,
            Activo:           true,
            ImagenUrl:        null,
            NumeroInterno:    "P001",
            PesoGramos:       200,
            UnidadesPorBulto: 1,
            Marca:            null,    // se quita la marca
            UnidadesPorMedia: 5);

        // Act
        var resultado = await _service.UpdateAsync(9, dto);

        // Assert
        Assert.NotNull(resultado);
        Assert.Null(resultado!.Marca);
        Assert.Null(productoExistente.Marca);
    }

    [Fact]
    public async Task UpdateAsync_IdInexistente_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(404))
            .ReturnsAsync((Producto?)null);

        var dto = new ActualizarProductoDto(
            Nombre:      "No importa",
            Descripcion: null,
            Precio:      0m,
            CategoriaId: 1,
            Activo:      true,
            ImagenUrl:   null,
            NumeroInterno: null);

        // Act
        var resultado = await _service.UpdateAsync(404, dto);

        // Assert
        Assert.Null(resultado);
        _repoMock.Verify(r => r.Update(It.IsAny<Producto>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(),            Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_IdValido_LlamaUpdateYSaveChanges()
    {
        // Arrange
        var productoExistente = BuildProducto(id: 5);

        _repoMock
            .Setup(r => r.GetByIdAsync(5))
            .ReturnsAsync(productoExistente);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ActualizarProductoDto(
            Nombre:           "Actualizado",
            Descripcion:      null,
            Precio:           1000m,
            CategoriaId:      1,
            Activo:           true,
            ImagenUrl:        null,
            NumeroInterno:    null,
            Marca:            "TestMarca",
            UnidadesPorMedia: 3);

        // Act
        await _service.UpdateAsync(5, dto);

        // Assert
        _repoMock.Verify(r => r.Update(productoExistente), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(),         Times.Once);
    }

    // -----------------------------------------------------------------------
    // Tests: GetByIdAsync — verificar que Marca y UnidadesPorMedia estén en el DTO
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetByIdAsync_ProductoConMarca_RetornaDtoConMarca()
    {
        // Arrange
        var producto = BuildProducto(id: 10, marca: "Unilever", unidadesPorMedia: 4);

        _repoMock
            .Setup(r => r.GetByIdAsync(10))
            .ReturnsAsync(producto);

        // Act
        var resultado = await _service.GetByIdAsync(10);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal("Unilever", resultado!.Marca);
        Assert.Equal(4,          resultado.UnidadesPorMedia);
    }

    [Fact]
    public async Task GetByIdAsync_ProductoSinMarca_RetornaDtoConMarcaNull()
    {
        // Arrange
        var producto = BuildProducto(id: 11, marca: null, unidadesPorMedia: 0);

        _repoMock
            .Setup(r => r.GetByIdAsync(11))
            .ReturnsAsync(producto);

        // Act
        var resultado = await _service.GetByIdAsync(11);

        // Assert
        Assert.NotNull(resultado);
        Assert.Null(resultado!.Marca);
        Assert.Equal(0, resultado.UnidadesPorMedia);
    }

    [Fact]
    public async Task GetByIdAsync_IdInexistente_RetornaNull()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((Producto?)null);

        // Act
        var resultado = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(resultado);
    }

    // -----------------------------------------------------------------------
    // Tests: DeleteAsync (soft-delete)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_IdValido_MarcaActivoFalse()
    {
        // Arrange
        var producto = BuildProducto(id: 20, activo: true);

        _repoMock
            .Setup(r => r.GetByIdAsync(20))
            .ReturnsAsync(producto);

        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var resultado = await _service.DeleteAsync(20);

        // Assert
        Assert.True(resultado);
        Assert.False(producto.Activo, "El soft-delete debe poner Activo = false");
    }

    [Fact]
    public async Task DeleteAsync_IdInexistente_RetornaFalse()
    {
        // Arrange
        _repoMock
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((Producto?)null);

        // Act
        var resultado = await _service.DeleteAsync(999);

        // Assert
        Assert.False(resultado);
        _repoMock.Verify(r => r.Update(It.IsAny<Producto>()), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(),            Times.Never);
    }

    // -----------------------------------------------------------------------
    // Tests: DTOs — verificar que los campos nuevos existen y son accesibles
    // -----------------------------------------------------------------------

    [Fact]
    public void ProductoDto_ContienePropiedad_Marca()
    {
        // Arrange & Act
        var dto = new ProductoDto(
            Id: 1, Nombre: "Test", Descripcion: null, Precio: 100m,
            CategoriaId: 1, CategoriaNombre: "Cat", Activo: true,
            ImagenUrl: null, NumeroInterno: null,
            PesoGramos: null, UnidadesPorBulto: 1, PrecioLista: null,
            Marca: "Arcor", UnidadesPorMedia: 7);

        // Assert
        Assert.Equal("Arcor", dto.Marca);
        Assert.Equal(7,       dto.UnidadesPorMedia);
    }

    [Fact]
    public void ProductoDto_MarcaNull_EsValorLegal()
    {
        // Arrange & Act: Marca es string? — debe aceptar null sin excepción
        var dto = new ProductoDto(
            Id: 2, Nombre: "Sin Marca", Descripcion: null, Precio: 200m,
            CategoriaId: 1, CategoriaNombre: "Cat", Activo: true,
            ImagenUrl: null, NumeroInterno: null,
            PesoGramos: null, UnidadesPorBulto: 1, PrecioLista: null,
            Marca: null, UnidadesPorMedia: 0);

        // Assert
        Assert.Null(dto.Marca);
        Assert.Equal(0, dto.UnidadesPorMedia);
    }

    [Fact]
    public void CrearProductoDto_ContienePropiedad_MarcaYUnidadesPorMedia()
    {
        // Arrange & Act
        var dto = new CrearProductoDto(
            Nombre:           "Producto Nuevo",
            Descripcion:      null,
            Precio:           500m,
            CategoriaId:      1,
            ImagenUrl:        null,
            NumeroInterno:    null,
            PesoGramos:       null,
            UnidadesPorBulto: 6,
            Marca:            "Bagley",
            UnidadesPorMedia: 3);

        // Assert
        Assert.Equal("Bagley", dto.Marca);
        Assert.Equal(3,        dto.UnidadesPorMedia);
    }

    [Fact]
    public void CrearProductoDto_MarcaOmitida_DefaultEsNull()
    {
        // Arrange & Act: usando los parámetros mínimos obligatorios;
        // Marca tiene default null por ser opcional
        var dto = new CrearProductoDto(
            Nombre:        "Solo Nombre",
            Descripcion:   null,
            Precio:        100m,
            CategoriaId:   1,
            ImagenUrl:     null,
            NumeroInterno: null);

        // Assert
        Assert.Null(dto.Marca);
        Assert.Equal(0, dto.UnidadesPorMedia);
    }

    [Fact]
    public void ActualizarProductoDto_ContienePropiedad_MarcaYUnidadesPorMedia()
    {
        // Arrange & Act
        var dto = new ActualizarProductoDto(
            Nombre:           "Producto Actualizado",
            Descripcion:      "Desc",
            Precio:           750m,
            CategoriaId:      2,
            Activo:           true,
            ImagenUrl:        null,
            NumeroInterno:    "P-99",
            PesoGramos:       250,
            UnidadesPorBulto: 12,
            Marca:            "Kraft",
            UnidadesPorMedia: 6);

        // Assert
        Assert.Equal("Kraft", dto.Marca);
        Assert.Equal(6,       dto.UnidadesPorMedia);
    }

    [Fact]
    public void ActualizarProductoDto_MarcaNull_EsValorLegal()
    {
        // Arrange & Act
        var dto = new ActualizarProductoDto(
            Nombre:        "Sin Marca",
            Descripcion:   null,
            Precio:        100m,
            CategoriaId:   1,
            Activo:        true,
            ImagenUrl:     null,
            NumeroInterno: null,
            Marca:         null,
            UnidadesPorMedia: 0);

        // Assert
        Assert.Null(dto.Marca);
        Assert.Equal(0, dto.UnidadesPorMedia);
    }
}
