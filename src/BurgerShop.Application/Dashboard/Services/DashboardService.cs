using BurgerShop.Application.Dashboard.DTOs;
using BurgerShop.Application.Dashboard.Interfaces;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Finanzas;
using BurgerShop.Domain.Interfaces.Inventario;
using BurgerShop.Domain.Interfaces.Ventas;
using BurgerShop.Domain.Entities.Inventario;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IVentaRepository _ventaRepo;
    private readonly IArtiStockRepository _stockRepo;
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly ICuentaCorrienteRepository _ctaCteRepo;
    private readonly ILocalService _localService;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(
        IVentaRepository ventaRepo,
        IArtiStockRepository stockRepo,
        ICierreCajaRepository cajaRepo,
        ICuentaCorrienteRepository ctaCteRepo,
        ILocalService localService,
        ILogger<DashboardService> logger)
    {
        _ventaRepo   = ventaRepo;
        _stockRepo   = stockRepo;
        _cajaRepo    = cajaRepo;
        _ctaCteRepo  = ctaCteRepo;
        _localService = localService;
        _logger      = logger;
    }

    public async Task<DashboardDto> GetDashboardAsync(int? localId, bool incluirComparativa)
    {
        try
        {
            var hoy  = DateTime.Today;
            var ayer = hoy.AddDays(-1);

            // --- Ventas del dia por tipo ---
            var (montoMostrador, cantMostrador) = await _ventaRepo.GetTotalesByFechaAsync(hoy, localId, (int)TipoVenta.Mostrador);
            var (montoDomicilio, cantDomicilio) = await _ventaRepo.GetTotalesByFechaAsync(hoy, localId, (int)TipoVenta.Domicilio);

            var montoTotalHoy = montoMostrador + montoDomicilio;
            var cantTotalHoy  = cantMostrador + cantDomicilio;
            var ticketPromedio = cantTotalHoy > 0 ? Math.Round(montoTotalHoy / cantTotalHoy, 2) : 0m;

            // --- % vs ayer ---
            var (montoAyer, cantAyer) = await _ventaRepo.GetTotalesByFechaAsync(ayer, localId, null);
            decimal porcentajeVsAyer = 0m;
            if (montoAyer > 0)
                porcentajeVsAyer = Math.Round(((montoTotalHoy - montoAyer) / montoAyer) * 100, 1);
            else if (montoTotalHoy > 0)
                porcentajeVsAyer = 100m;

            // --- Caja ---
            var caja = await _cajaRepo.GetCajaAbiertaAsync(localId);
            var cajaAbierta = caja is not null;
            var montoCaja   = caja?.MontoInicial ?? 0m;

            // --- Top productos del dia ---
            var ventasHoy = (await _ventaRepo.GetVentasHoyConLineasAsync(localId)).ToList();

            var topProductos = ventasHoy
                .SelectMany(v => v.Lineas)
                .Where(l => l.ProductoId.HasValue && l.Producto is not null)
                .GroupBy(l => new { l.ProductoId, Nombre = l.Producto!.Nombre })
                .Select(g => new TopProductoDto(
                    g.Key.Nombre,
                    g.Sum(l => l.Cantidad),
                    g.Sum(l => l.Subtotal)))
                .OrderByDescending(p => p.CantidadVendida)
                .Take(10)
                .ToList();

            // --- Repartos domicilio ---
            var estadosPendientes = new[] { EstadoVenta.Pendiente, EstadoVenta.Asignado, EstadoVenta.EnCamino };
            var ventasDomicilioHoy = ventasHoy.Where(v => v.Tipo == TipoVenta.Domicilio).ToList();
            var pedidosPendientesEntrega = ventasDomicilioHoy.Count(v => estadosPendientes.Contains(v.Estado));
            var pedidosEntregadosHoy     = ventasDomicilioHoy.Count(v => v.Estado == EstadoVenta.Entregado);

            // --- Stock ---
            List<StockCriticoDto> stockBajo;
            int productosSinStock;
            int productosStockCritico;

            if (localId.HasValue)
            {
                var stockItems = (await _stockRepo.GetStockBajoAsync(localId.Value)).ToList();
                productosSinStock    = stockItems.Count(s => s.StockFinal <= 0);
                productosStockCritico = stockItems.Count;
                stockBajo = stockItems
                    .OrderBy(s => s.StockFinal)
                    .Take(10)
                    .Select(s => new StockCriticoDto(
                        s.Producto.Nombre,
                        s.StockFinal,
                        s.StockMinimo))
                    .ToList();
            }
            else
            {
                // SuperAdmin sin local: tomar todos los locales
                var locales = await _localService.GetAllAsync();
                var todosStockBajo = new List<StockCriticoDto>();
                var setSinStock   = 0;
                var setCritico    = 0;

                foreach (var loc in locales)
                {
                    var items = (await _stockRepo.GetStockBajoAsync(loc.Id)).ToList();
                    setSinStock += items.Count(s => s.StockFinal <= 0);
                    setCritico  += items.Count;
                    todosStockBajo.AddRange(items.Select(s => new StockCriticoDto(
                        s.Producto.Nombre,
                        s.StockFinal,
                        s.StockMinimo)));
                }

                productosSinStock    = setSinStock;
                productosStockCritico = setCritico;
                stockBajo = todosStockBajo
                    .OrderBy(s => s.StockActual)
                    .Take(10)
                    .ToList();
            }

            // --- Cuenta Corriente ---
            var cuentasConSaldo = (await _ctaCteRepo.GetConSaldoAsync(localId)).ToList();
            var saldoCtaCteTotal = cuentasConSaldo.Sum(c => c.SaldoActual);
            var clientesConDeuda = cuentasConSaldo.Count;
            var topDeudores = cuentasConSaldo
                .Take(5)
                .Select(c => new TopDeudorDto(
                    c.Cliente?.Nombre ?? $"Cliente #{c.ClienteId}",
                    c.SaldoActual))
                .ToList();

            // --- Comparativa por local (solo SuperAdmin) ---
            List<VentasPorLocalDto>? comparativaLocales = null;
            if (incluirComparativa)
            {
                var locales = await _localService.GetAllAsync();
                var comparativa = new List<VentasPorLocalDto>();

                foreach (var loc in locales)
                {
                    var (monto, cant) = await _ventaRepo.GetTotalesByFechaAsync(hoy, loc.Id, null);
                    comparativa.Add(new VentasPorLocalDto(loc.Id, loc.Nombre, cant, monto));
                }

                comparativaLocales = comparativa
                    .OrderByDescending(c => c.MontoTotal)
                    .ToList();
            }

            return new DashboardDto(
                VentasMostradorHoy:       cantMostrador,
                MontoMostradorHoy:        montoMostrador,
                VentasDomicilioHoy:       cantDomicilio,
                MontoDomicilioHoy:        montoDomicilio,
                TicketPromedio:           ticketPromedio,
                PorcentajeVsAyer:         porcentajeVsAyer,
                CajaAbierta:              cajaAbierta,
                MontoCaja:                montoCaja,
                TopProductos:             topProductos,
                ProductosStockCritico:    productosStockCritico,
                ProductosSinStock:        productosSinStock,
                StockBajo:                stockBajo,
                SaldoCtaCteTotal:         saldoCtaCteTotal,
                ClientesConDeuda:         clientesConDeuda,
                TopDeudores:              topDeudores,
                PedidosPendientesEntrega: pedidosPendientesEntrega,
                PedidosEntregadosHoy:     pedidosEntregadosHoy,
                ComparativaLocales:       comparativaLocales
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetDashboardAsync), ex.Message);
            throw;
        }
    }
}
