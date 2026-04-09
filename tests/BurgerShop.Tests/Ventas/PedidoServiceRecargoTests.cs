using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Services;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Application.Inventario.Interfaces;
using Moq;

namespace BurgerShop.Tests.Ventas;

/// <summary>
/// Tests unitarios para VentaService con foco en el cálculo de recargo
/// según la forma de pago seleccionada.
///
/// Fórmula testeada:
///   recargo = (subtotal - descuento) * porcentajeRecargo / 100
///   total   = subtotal - descuento + recargo
/// </summary>
public class PedidoServiceRecargoTests
{
    private readonly Mock<IVentaRepository>         _ventaRepoMock;
    private readonly Mock<IProductoRepository>      _productoRepoMock;
    private readonly Mock<IComboRepository>         _comboRepoMock;
    private readonly Mock<IRepository<FormaPago>>   _formaPagoRepoMock;
    private readonly Mock<ICierreCajaRepository>    _cajaRepoMock;
    private readonly VentaService                   _service;

    public PedidoServiceRecargoTests()
    {
        _ventaRepoMock     = new Mock<IVentaRepository>();
        _productoRepoMock  = new Mock<IProductoRepository>();
        _comboRepoMock     = new Mock<IComboRepository>();
        _formaPagoRepoMock = new Mock<IRepository<FormaPago>>();
        _cajaRepoMock      = new Mock<ICierreCajaRepository>();

        // Por defecto no hay caja abierta (comportamiento neutro para los tests existentes)
        _cajaRepoMock
            .Setup(r => r.GetCajaAbiertaAsync(It.IsAny<int?>()))
            .ReturnsAsync((BurgerShop.Domain.Entities.Finanzas.CierreCaja?)null);

        _service = new VentaService(
            _ventaRepoMock.Object,
            _productoRepoMock.Object,
            _comboRepoMock.Object,
            _formaPagoRepoMock.Object,
            _cajaRepoMock.Object,
            new Mock<IMovimientoService>().Object);

        // Setup genérico: GetSiguienteNumeroTicketAsync devuelve 1
        _ventaRepoMock
            .Setup(r => r.GetSiguienteNumeroTicketAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(1);

        // Setup genérico: GetSiguienteNumeroVentaAsync devuelve 1
        _ventaRepoMock
            .Setup(r => r.GetSiguienteNumeroVentaAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(1);

        // Setup genérico: AddAsync no hace nada especial
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .ReturnsAsync((Venta v) => v);

        _ventaRepoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Setup genérico: GetByIdWithLineasAsync devuelve la venta que se guardó
        // (se sobreescribe por test cuando se necesita un valor específico)
        _ventaRepoMock
            .Setup(r => r.GetByIdWithLineasAsync(It.IsAny<int>()))
            .ReturnsAsync((int id) => BuildVentaConId(id));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Crea un DTO mínimo de creación de venta con una línea de producto.
    /// </summary>
    private static CrearVentaDto BuildCrearVentaDto(
        int? formaPagoId = null,
        decimal descuento = 0m,
        decimal precioUnitario = 100m,
        int cantidad = 1)
    {
        return new CrearVentaDto(
            Tipo: TipoVenta.Mostrador,
            ClienteId: null,
            NombreCliente: "Test Cliente",
            TelefonoCliente: null,
            DireccionEntrega: null,
            ZonaId: null,
            Descuento: descuento,
            FormaPagoId: formaPagoId,
            NotaInterna: null,
            TipoFactura: TipoFactura.FacturaB,
            Lineas: new List<CrearLineaVentaDto>
            {
                new(ProductoId: 1, ComboId: null,
                    Cantidad: cantidad, PrecioUnitario: precioUnitario, Notas: null)
            });
    }

    /// <summary>
    /// Construye una Venta mínima para que GetByIdWithLineasAsync no devuelva null.
    /// El VentaService llama a GetByIdWithLineasAsync(venta.Id) luego del AddAsync,
    /// y usa ese resultado para construir el DTO de retorno. Como en tests el Id
    /// queda en 0 (no hay BD real), construimos una venta básica con Id = id.
    /// </summary>
    private static Venta BuildVentaConId(int id) =>
        new()
        {
            Id = id,
            NumeroTicket = $"V-20260305-0001",
            FechaCreacion = DateTime.Now,
            Tipo = TipoVenta.Mostrador,
            Estado = EstadoVenta.Pendiente,
            Lineas = new List<LineaVenta>()
        };

    private void SetupProductoRepo(int productoId, string nombre = "Hamburguesa")
    {
        _productoRepoMock
            .Setup(r => r.GetByIdAsync(productoId))
            .ReturnsAsync(new Producto { Id = productoId, Nombre = nombre });
    }

    private void SetupFormaPago(int formaPagoId, decimal porcentajeRecargo, bool activa = true)
    {
        _formaPagoRepoMock
            .Setup(r => r.GetByIdAsync(formaPagoId))
            .ReturnsAsync(new FormaPago
            {
                Id = formaPagoId,
                Nombre = $"FormaPago_{formaPagoId}",
                PorcentajeRecargo = porcentajeRecargo,
                Activa = activa
            });
    }

    // -----------------------------------------------------------------------
    // Tests: Recargo
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_SinFormaPago_RecargoEsCero()
    {
        // Arrange
        SetupProductoRepo(1);

        // dto sin FormaPagoId (null)
        var dto = BuildCrearVentaDto(formaPagoId: null, descuento: 0m, precioUnitario: 200m, cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(0m, ventaGuardada!.Recargo);
        // Total = subtotal - descuento + recargo = 200 - 0 + 0 = 200
        Assert.Equal(200m, ventaGuardada.Total);

        // No se debe consultar la tabla de formas de pago
        _formaPagoRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ConFormaPagoSinRecargo_RecargoEsCero()
    {
        // Arrange
        SetupProductoRepo(1);
        SetupFormaPago(formaPagoId: 1, porcentajeRecargo: 0m);

        var dto = BuildCrearVentaDto(formaPagoId: 1, descuento: 0m, precioUnitario: 500m, cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        // PorcentajeRecargo = 0 → la condición (porcentajeRecargo > 0) es falsa → recargo = 0
        Assert.NotNull(ventaGuardada);
        Assert.Equal(0m,   ventaGuardada!.Recargo);
        Assert.Equal(500m, ventaGuardada.Total);
    }

    [Fact]
    public async Task CreateAsync_ConFormaPago10PorCiento_RecargoCalculadoCorrectamente()
    {
        // Arrange
        //   subtotal  = 1000
        //   descuento = 0
        //   recargo   = (1000 - 0) * 10 / 100 = 100
        //   total     = 1000 - 0 + 100 = 1100
        SetupProductoRepo(1);
        SetupFormaPago(formaPagoId: 2, porcentajeRecargo: 10m);

        var dto = BuildCrearVentaDto(formaPagoId: 2, descuento: 0m, precioUnitario: 1000m, cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(1000m, ventaGuardada!.Subtotal);
        Assert.Equal(100m,  ventaGuardada.Recargo);
        Assert.Equal(1100m, ventaGuardada.Total);
    }

    [Fact]
    public async Task CreateAsync_ConDescuentoYRecargo_CalculaBaseNeta()
    {
        // Arrange
        //   subtotal  = 1000
        //   descuento = 200
        //   recargo   = (1000 - 200) * 10 / 100 = 80
        //   total     = 1000 - 200 + 80 = 880
        SetupProductoRepo(1);
        SetupFormaPago(formaPagoId: 2, porcentajeRecargo: 10m);

        var dto = BuildCrearVentaDto(formaPagoId: 2, descuento: 200m, precioUnitario: 1000m, cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(1000m, ventaGuardada!.Subtotal);
        Assert.Equal(80m,   ventaGuardada.Recargo);
        Assert.Equal(880m,  ventaGuardada.Total);
    }

    [Fact]
    public async Task CreateAsync_ConFormaPago5Porciento_RecargoDecimalCorrecto()
    {
        // Arrange
        //   subtotal  = 300  (3 items × $100)
        //   descuento = 0
        //   recargo   = (300 - 0) * 5 / 100 = 15
        //   total     = 300 + 15 = 315
        SetupProductoRepo(1);
        SetupFormaPago(formaPagoId: 3, porcentajeRecargo: 5m);

        var dto = BuildCrearVentaDto(formaPagoId: 3, descuento: 0m, precioUnitario: 100m, cantidad: 3);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(300m, ventaGuardada!.Subtotal);
        Assert.Equal(15m,  ventaGuardada.Recargo);
        Assert.Equal(315m, ventaGuardada.Total);
    }

    [Fact]
    public async Task CreateAsync_ConFormaPagoInexistente_RecargoEsCero()
    {
        // Arrange
        // El repo devuelve null para ese formaPagoId: la lógica del servicio
        // verifica (formaPago is not null) antes de calcular el recargo.
        SetupProductoRepo(1);

        _formaPagoRepoMock
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((FormaPago?)null);

        var dto = BuildCrearVentaDto(formaPagoId: 999, descuento: 0m, precioUnitario: 500m, cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(0m,   ventaGuardada!.Recargo);
        Assert.Equal(500m, ventaGuardada.Total);
    }

    // -----------------------------------------------------------------------
    // Tests: Subtotal y campos de la venta
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_MultipleLineas_SubtotalEsSumaCorrectaDeLineas()
    {
        // Arrange
        //   línea 1: producto 1, 2 × $150 = $300
        //   línea 2: producto 2, 1 × $50  = $50
        //   subtotal = $350
        _productoRepoMock
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(new Producto { Id = 1, Nombre = "Hamburguesa Clásica" });

        _productoRepoMock
            .Setup(r => r.GetByIdAsync(2))
            .ReturnsAsync(new Producto { Id = 2, Nombre = "Papas Fritas" });

        var dto = new CrearVentaDto(
            Tipo: TipoVenta.Mostrador,
            ClienteId: null,
            NombreCliente: "Cliente Test",
            TelefonoCliente: null,
            DireccionEntrega: null,
            ZonaId: null,
            Descuento: 0m,
            FormaPagoId: null,
            NotaInterna: null,
            TipoFactura: TipoFactura.FacturaB,
            Lineas: new List<CrearLineaVentaDto>
            {
                new(ProductoId: 1, ComboId: null, Cantidad: 2, PrecioUnitario: 150m, Notas: null),
                new(ProductoId: 2, ComboId: null, Cantidad: 1, PrecioUnitario: 50m,  Notas: null)
            });

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(350m, ventaGuardada!.Subtotal);
        Assert.Equal(0m,   ventaGuardada.Recargo);
        Assert.Equal(350m, ventaGuardada.Total);
        Assert.Equal(2,    ventaGuardada.Lineas.Count);
    }

    [Fact]
    public async Task CreateAsync_EstadoInicialEsPendiente()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearVentaDto();

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(EstadoVenta.Pendiente, ventaGuardada!.Estado);
    }

    [Fact]
    public async Task CreateAsync_NumeroTicketConFormatoEsperado()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearVentaDto();

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert: el ticket tiene formato "V-YYYYMMDD-NNNN" (tipo Mostrador)
        Assert.NotNull(ventaGuardada);
        Assert.Matches(@"^V-\d{8}-\d{4}$", ventaGuardada!.NumeroTicket);
    }

    [Fact]
    public async Task CreateAsync_GuardaEnRepositorioYLlamaASaveChanges()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearVentaDto();

        // Act
        await _service.CreateAsync(dto);

        // Assert
        _ventaRepoMock.Verify(r => r.AddAsync(It.IsAny<Venta>()), Times.Once);
        _ventaRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    // -----------------------------------------------------------------------
    // Tests: Fórmula completa de recargo con valores de borde
    // -----------------------------------------------------------------------

    [Theory]
    [InlineData(1000,  0,  10,  100,  1100)]  // caso estándar 10%
    [InlineData(1000, 100, 10,   90,   990)]  // con descuento 10%
    [InlineData( 500,   0,  5,   25,   525)]  // 5% sin descuento
    [InlineData( 200,  50, 20,   30,   180)]  // 20% con descuento
    [InlineData(1000,   0,  0,    0,  1000)]  // 0% → no hay recargo
    public async Task CreateAsync_FormulasDeRecargo_SonCorrectas(
        decimal precio, decimal descuento, decimal porcentaje,
        decimal recargoEsperado, decimal totalEsperado)
    {
        // Arrange
        SetupProductoRepo(1);

        if (porcentaje > 0)
            SetupFormaPago(formaPagoId: 5, porcentajeRecargo: porcentaje);
        else
            SetupFormaPago(formaPagoId: 5, porcentajeRecargo: 0m);

        var dto = BuildCrearVentaDto(
            formaPagoId: 5,
            descuento: descuento,
            precioUnitario: precio,
            cantidad: 1);

        Venta? ventaGuardada = null;
        _ventaRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Venta>()))
            .Callback<Venta>(v => ventaGuardada = v)
            .ReturnsAsync((Venta v) => v);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(ventaGuardada);
        Assert.Equal(recargoEsperado, ventaGuardada!.Recargo);
        Assert.Equal(totalEsperado,   ventaGuardada.Total);
    }
}
