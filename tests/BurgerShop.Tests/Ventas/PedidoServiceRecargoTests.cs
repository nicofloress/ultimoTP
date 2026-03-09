using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Services;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Finanzas;
using Moq;

namespace BurgerShop.Tests.Ventas;

/// <summary>
/// Tests unitarios para PedidoService con foco en el cálculo de recargo
/// según la forma de pago seleccionada.
///
/// Fórmula testeada:
///   recargo = (subtotal - descuento) * porcentajeRecargo / 100
///   total   = subtotal - descuento + recargo
/// </summary>
public class PedidoServiceRecargoTests
{
    private readonly Mock<IPedidoRepository>       _pedidoRepoMock;
    private readonly Mock<IProductoRepository>     _productoRepoMock;
    private readonly Mock<IComboRepository>        _comboRepoMock;
    private readonly Mock<IRepository<FormaPago>>  _formaPagoRepoMock;
    private readonly Mock<ICierreCajaRepository>   _cajaRepoMock;
    private readonly PedidoService                 _service;

    public PedidoServiceRecargoTests()
    {
        _pedidoRepoMock    = new Mock<IPedidoRepository>();
        _productoRepoMock  = new Mock<IProductoRepository>();
        _comboRepoMock     = new Mock<IComboRepository>();
        _formaPagoRepoMock = new Mock<IRepository<FormaPago>>();
        _cajaRepoMock      = new Mock<ICierreCajaRepository>();

        // Por defecto no hay caja abierta (comportamiento neutro para los tests existentes)
        _cajaRepoMock
            .Setup(r => r.GetCajaAbiertaAsync())
            .ReturnsAsync((BurgerShop.Domain.Entities.Finanzas.CierreCaja?)null);

        _service = new PedidoService(
            _pedidoRepoMock.Object,
            _productoRepoMock.Object,
            _comboRepoMock.Object,
            _formaPagoRepoMock.Object,
            _cajaRepoMock.Object);

        // Setup genérico: GetSiguienteNumeroTicketAsync devuelve 1
        _pedidoRepoMock
            .Setup(r => r.GetSiguienteNumeroTicketAsync(It.IsAny<DateTime>()))
            .ReturnsAsync(1);

        // Setup genérico: AddAsync no hace nada especial
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .ReturnsAsync((Pedido p) => p);

        _pedidoRepoMock
            .Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Setup genérico: GetByIdWithLineasAsync devuelve el pedido que se guardó
        // (se sobreescribe por test cuando se necesita un valor específico)
        _pedidoRepoMock
            .Setup(r => r.GetByIdWithLineasAsync(It.IsAny<int>()))
            .ReturnsAsync((int id) => BuildPedidoConId(id));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Crea un DTO mínimo de creación de pedido con una línea de producto.
    /// </summary>
    private static CrearPedidoDto BuildCrearPedidoDto(
        int? formaPagoId = null,
        decimal descuento = 0m,
        decimal precioUnitario = 100m,
        int cantidad = 1)
    {
        return new CrearPedidoDto(
            Tipo: TipoPedido.ParaLlevar,
            ClienteId: null,
            NombreCliente: "Test Cliente",
            TelefonoCliente: null,
            DireccionEntrega: null,
            ZonaId: null,
            Descuento: descuento,
            FormaPagoId: formaPagoId,
            NotaInterna: null,
            TipoFactura: TipoFactura.FacturaB,
            Lineas: new List<CrearLineaPedidoDto>
            {
                new(ProductoId: 1, ComboId: null,
                    Cantidad: cantidad, PrecioUnitario: precioUnitario, Notas: null)
            });
    }

    /// <summary>
    /// Construye un Pedido mínimo para que GetByIdWithLineasAsync no devuelva null.
    /// El PedidoService llama a GetByIdWithLineasAsync(pedido.Id) luego del AddAsync,
    /// y usa ese resultado para construir el DTO de retorno. Como en tests el Id
    /// queda en 0 (no hay BD real), construimos un pedido básico con Id = id.
    /// </summary>
    private static Pedido BuildPedidoConId(int id) =>
        new()
        {
            Id = id,
            NumeroTicket = $"T-20260305-0001",
            FechaCreacion = DateTime.Now,
            Tipo = TipoPedido.ParaLlevar,
            Estado = EstadoPedido.Pendiente,
            Lineas = new List<LineaPedido>()
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
        var dto = BuildCrearPedidoDto(formaPagoId: null, descuento: 0m, precioUnitario: 200m, cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(0m, pedidoGuardado!.Recargo);
        // Total = subtotal - descuento + recargo = 200 - 0 + 0 = 200
        Assert.Equal(200m, pedidoGuardado.Total);

        // No se debe consultar la tabla de formas de pago
        _formaPagoRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ConFormaPagoSinRecargo_RecargoEsCero()
    {
        // Arrange
        SetupProductoRepo(1);
        SetupFormaPago(formaPagoId: 1, porcentajeRecargo: 0m);

        var dto = BuildCrearPedidoDto(formaPagoId: 1, descuento: 0m, precioUnitario: 500m, cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        // PorcentajeRecargo = 0 → la condición (porcentajeRecargo > 0) es falsa → recargo = 0
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(0m,   pedidoGuardado!.Recargo);
        Assert.Equal(500m, pedidoGuardado.Total);
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

        var dto = BuildCrearPedidoDto(formaPagoId: 2, descuento: 0m, precioUnitario: 1000m, cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(1000m, pedidoGuardado!.Subtotal);
        Assert.Equal(100m,  pedidoGuardado.Recargo);
        Assert.Equal(1100m, pedidoGuardado.Total);
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

        var dto = BuildCrearPedidoDto(formaPagoId: 2, descuento: 200m, precioUnitario: 1000m, cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(1000m, pedidoGuardado!.Subtotal);
        Assert.Equal(80m,   pedidoGuardado.Recargo);
        Assert.Equal(880m,  pedidoGuardado.Total);
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

        var dto = BuildCrearPedidoDto(formaPagoId: 3, descuento: 0m, precioUnitario: 100m, cantidad: 3);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(300m, pedidoGuardado!.Subtotal);
        Assert.Equal(15m,  pedidoGuardado.Recargo);
        Assert.Equal(315m, pedidoGuardado.Total);
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

        var dto = BuildCrearPedidoDto(formaPagoId: 999, descuento: 0m, precioUnitario: 500m, cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(0m,   pedidoGuardado!.Recargo);
        Assert.Equal(500m, pedidoGuardado.Total);
    }

    // -----------------------------------------------------------------------
    // Tests: Subtotal y campos del pedido
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

        var dto = new CrearPedidoDto(
            Tipo: TipoPedido.ParaLlevar,
            ClienteId: null,
            NombreCliente: "Cliente Test",
            TelefonoCliente: null,
            DireccionEntrega: null,
            ZonaId: null,
            Descuento: 0m,
            FormaPagoId: null,
            NotaInterna: null,
            TipoFactura: TipoFactura.FacturaB,
            Lineas: new List<CrearLineaPedidoDto>
            {
                new(ProductoId: 1, ComboId: null, Cantidad: 2, PrecioUnitario: 150m, Notas: null),
                new(ProductoId: 2, ComboId: null, Cantidad: 1, PrecioUnitario: 50m,  Notas: null)
            });

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(350m, pedidoGuardado!.Subtotal);
        Assert.Equal(0m,   pedidoGuardado.Recargo);
        Assert.Equal(350m, pedidoGuardado.Total);
        Assert.Equal(2,    pedidoGuardado.Lineas.Count);
    }

    [Fact]
    public async Task CreateAsync_EstadoInicialEsPendiente()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearPedidoDto();

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(EstadoPedido.Pendiente, pedidoGuardado!.Estado);
    }

    [Fact]
    public async Task CreateAsync_NumeroTicketConFormatoEsperado()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearPedidoDto();

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert: el ticket tiene formato "T-YYYYMMDD-NNNN"
        Assert.NotNull(pedidoGuardado);
        Assert.Matches(@"^T-\d{8}-\d{4}$", pedidoGuardado!.NumeroTicket);
    }

    [Fact]
    public async Task CreateAsync_GuardaEnRepositorioYLlamaASaveChanges()
    {
        // Arrange
        SetupProductoRepo(1);
        var dto = BuildCrearPedidoDto();

        // Act
        await _service.CreateAsync(dto);

        // Assert
        _pedidoRepoMock.Verify(r => r.AddAsync(It.IsAny<Pedido>()), Times.Once);
        _pedidoRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
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

        var dto = BuildCrearPedidoDto(
            formaPagoId: 5,
            descuento: descuento,
            precioUnitario: precio,
            cantidad: 1);

        Pedido? pedidoGuardado = null;
        _pedidoRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Pedido>()))
            .Callback<Pedido>(p => pedidoGuardado = p)
            .ReturnsAsync((Pedido p) => p);

        // Act
        await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(pedidoGuardado);
        Assert.Equal(recargoEsperado, pedidoGuardado!.Recargo);
        Assert.Equal(totalEsperado,   pedidoGuardado.Total);
    }
}
