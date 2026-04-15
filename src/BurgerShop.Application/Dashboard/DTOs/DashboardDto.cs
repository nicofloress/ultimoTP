namespace BurgerShop.Application.Dashboard.DTOs;

public record DashboardDto(
    // Ventas del dia
    int VentasMostradorHoy,
    decimal MontoMostradorHoy,
    int VentasDomicilioHoy,
    decimal MontoDomicilioHoy,
    decimal TicketPromedio,
    decimal PorcentajeVsAyer,

    // Caja
    bool CajaAbierta,
    decimal MontoCaja,

    // Top productos del dia
    List<TopProductoDto> TopProductos,

    // Stock
    int ProductosStockCritico,
    int ProductosSinStock,
    List<StockCriticoDto> StockBajo,

    // Cuenta corriente
    decimal SaldoCtaCteTotal,
    int ClientesConDeuda,
    List<TopDeudorDto> TopDeudores,

    // Repartos
    int PedidosPendientesEntrega,
    int PedidosEntregadosHoy,

    // Solo SuperAdmin: comparativa entre locales
    List<VentasPorLocalDto>? ComparativaLocales
);

public record TopProductoDto(
    string Nombre,
    decimal CantidadVendida,
    decimal MontoTotal
);

public record StockCriticoDto(
    string ProductoNombre,
    decimal StockActual,
    decimal? StockMinimo
);

public record TopDeudorDto(
    string ClienteNombre,
    decimal Saldo
);

public record VentasPorLocalDto(
    int LocalId,
    string LocalNombre,
    int CantidadVentas,
    decimal MontoTotal
);
