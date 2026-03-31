using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Ventas;

namespace BurgerShop.Application.Ventas.Services;

public class VentaService : IVentaService
{
    private readonly IVentaRepository _ventaRepo;
    private readonly IPedidoRepository _pedidoRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IComboRepository _comboRepo;
    private readonly IRepository<FormaPago> _formaPagoRepo;
    private readonly IMovimientoService _movimientoService;

    public VentaService(
        IVentaRepository ventaRepo,
        IPedidoRepository pedidoRepo,
        IProductoRepository productoRepo,
        IComboRepository comboRepo,
        IRepository<FormaPago> formaPagoRepo,
        IMovimientoService movimientoService)
    {
        _ventaRepo = ventaRepo;
        _pedidoRepo = pedidoRepo;
        _productoRepo = productoRepo;
        _comboRepo = comboRepo;
        _formaPagoRepo = formaPagoRepo;
        _movimientoService = movimientoService;
    }

    // ----------------------------------------------------------------
    // Crear venta mostrador (POS)
    // ----------------------------------------------------------------
    public async Task<VentaDto> CrearVentaMostradorAsync(CrearVentaDto dto, int? usuarioId)
    {
        var ahora = DateTime.Now;
        var numero = await _ventaRepo.GetSiguienteNumeroVentaAsync(ahora);
        var numeroVenta = $"V-{ahora:yyyyMMdd}-{numero:D4}";

        var venta = new Venta
        {
            NumeroVenta = numeroVenta,
            Fecha = ahora,
            TipoVenta = TipoVenta.Mostrador,
            ClienteId = dto.ClienteId,
            NombreCliente = dto.NombreCliente,
            TelefonoCliente = dto.TelefonoCliente,
            LocalId = dto.LocalId,
            FormaPagoId = dto.FormaPagoId,
            Descuento = dto.Descuento,
            Observaciones = dto.Observaciones,
            EstaPago = dto.EstaPago,
            UsuarioId = usuarioId
        };

        decimal subtotal = 0;
        foreach (var detalleDto in dto.Detalles)
        {
            string descripcion;
            if (detalleDto.ProductoId.HasValue)
            {
                var producto = await _productoRepo.GetByIdAsync(detalleDto.ProductoId.Value);
                descripcion = producto?.Nombre ?? "Producto";
            }
            else if (detalleDto.ComboId.HasValue)
            {
                var combo = await _comboRepo.GetByIdAsync(detalleDto.ComboId.Value);
                descripcion = combo?.Nombre ?? "Combo";
            }
            else
            {
                descripcion = "Item";
            }

            var lineaSubtotal = detalleDto.PrecioUnitario * detalleDto.Cantidad;
            venta.Detalles.Add(new VentaDetalle
            {
                ProductoId = detalleDto.ProductoId,
                ComboId = detalleDto.ComboId,
                Descripcion = descripcion,
                Cantidad = detalleDto.Cantidad,
                PrecioUnitario = detalleDto.PrecioUnitario,
                Subtotal = lineaSubtotal,
                Notas = detalleDto.Notas
            });
            subtotal += lineaSubtotal;
        }

        venta.Subtotal = subtotal;

        if (dto.Pagos is { Count: > 0 })
        {
            // Modo pago dividido: múltiples formas de pago
            decimal recargoTotal = 0;
            venta.FormaPagoId = null;

            foreach (var pagoDto in dto.Pagos)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                var recargoPago = pagoDto.Monto * porcentaje / 100m;
                var totalACobrar = pagoDto.Monto + recargoPago;

                venta.Pagos.Add(new PagoVenta
                {
                    FormaPagoId = pagoDto.FormaPagoId,
                    Monto = pagoDto.Monto,
                    PorcentajeRecargo = porcentaje,
                    Recargo = recargoPago,
                    TotalACobrar = totalACobrar
                });

                recargoTotal += recargoPago;
            }

            venta.Recargo = recargoTotal;
            venta.Total = subtotal - dto.Descuento + recargoTotal;
        }
        else
        {
            // Modo pago simple: una sola forma de pago
            decimal recargo = 0;

            if (dto.FormaPagoId.HasValue)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                {
                    recargo = (subtotal - dto.Descuento) * formaPago.PorcentajeRecargo / 100m;
                }
            }

            venta.Recargo = recargo;
            venta.Total = subtotal - dto.Descuento + recargo;
        }

        await _ventaRepo.AddAsync(venta);
        await _ventaRepo.SaveChangesAsync();

        // Solo generar movimientos para ventas de mostrador (entrega inmediata)
        // Las ventas con envío a domicilio generan movimientos al finalizar reparto / aprobar rendición
        if (dto.TipoVenta == TipoVenta.Mostrador)
        {
            // Registrar movimientos de stock (EGR_VTA por cada producto/combo)
            await RegistrarMovimientosStockVentaAsync(venta, usuarioId);

            // Registrar movimiento de caja (ING_VTA por el total) solo si está pago
            if (dto.EstaPago)
                await RegistrarMovimientoCajaVentaAsync(venta, usuarioId);
        }

        var creada = await _ventaRepo.GetByIdConDetallesAsync(venta.Id);
        return ToDto(creada!);
    }

    // ----------------------------------------------------------------
    // Crear venta domicilio vinculada a un pedido entregado
    // ----------------------------------------------------------------
    public async Task<VentaDto> CrearVentaDomicilioAsync(int pedidoId, int localId, int? usuarioId)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId)
            ?? throw new InvalidOperationException($"Pedido {pedidoId} no encontrado.");

        // Si ya existe una venta para este pedido, retornarla sin crear otra
        var ventaExistente = await _ventaRepo.GetByPedidoIdAsync(pedidoId);
        if (ventaExistente is not null)
            return ToDto(ventaExistente);

        var ahora = DateTime.Now;
        var numero = await _ventaRepo.GetSiguienteNumeroVentaAsync(ahora);
        var numeroVenta = $"V-{ahora:yyyyMMdd}-{numero:D4}";

        var venta = new Venta
        {
            NumeroVenta = numeroVenta,
            Fecha = ahora,
            TipoVenta = TipoVenta.Domicilio,
            ClienteId = pedido.ClienteId,
            NombreCliente = pedido.NombreCliente,
            TelefonoCliente = pedido.TelefonoCliente,
            LocalId = localId,
            PedidoId = pedidoId,
            FormaPagoId = pedido.FormaPagoId,
            Subtotal = pedido.Subtotal,
            Descuento = pedido.Descuento,
            Recargo = pedido.Recargo,
            Total = pedido.Total,
            EstaPago = pedido.EstaPago,
            UsuarioId = usuarioId
        };

        // Copiar líneas del pedido a detalles de la venta
        foreach (var linea in pedido.Lineas)
        {
            venta.Detalles.Add(new VentaDetalle
            {
                ProductoId = linea.ProductoId,
                ComboId = linea.ComboId,
                Descripcion = linea.Descripcion,
                Cantidad = linea.Cantidad,
                PrecioUnitario = linea.PrecioUnitario,
                Subtotal = linea.Subtotal,
                Notas = linea.Notas
            });
        }

        // Copiar pagos del pedido a pagos de la venta
        foreach (var pago in pedido.Pagos)
        {
            venta.Pagos.Add(new PagoVenta
            {
                FormaPagoId = pago.FormaPagoId,
                Monto = pago.Monto,
                PorcentajeRecargo = pago.PorcentajeRecargo,
                Recargo = pago.Recargo,
                TotalACobrar = pago.TotalACobrar
            });
        }

        await _ventaRepo.AddAsync(venta);
        await _ventaRepo.SaveChangesAsync();

        // Los movimientos de stock y caja para pedidos de domicilio
        // ya fueron registrados al confirmar la entrega. No se duplican.

        var creada = await _ventaRepo.GetByIdConDetallesAsync(venta.Id);
        return ToDto(creada!);
    }

    // ----------------------------------------------------------------
    // Consultas
    // ----------------------------------------------------------------
    public async Task<VentaDto?> GetByIdAsync(int id)
    {
        var venta = await _ventaRepo.GetByIdConDetallesAsync(id);
        return venta is null ? null : ToDto(venta);
    }

    public async Task<IEnumerable<VentaDto>> GetByFechaAsync(DateTime fecha)
    {
        var ventas = await _ventaRepo.GetByFechaAsync(fecha);
        return ventas.Select(ToDto);
    }

    public async Task<IEnumerable<VentaDto>> GetByRangoFechasAsync(DateTime desde, DateTime hasta)
    {
        var ventas = await _ventaRepo.GetByRangoFechasAsync(desde, hasta);
        return ventas.Select(ToDto);
    }

    public async Task<VentaDto?> GetByPedidoIdAsync(int pedidoId)
    {
        var venta = await _ventaRepo.GetByPedidoIdAsync(pedidoId);
        return venta is null ? null : ToDto(venta);
    }

    // ----------------------------------------------------------------
    // Movimientos de inventario para venta mostrador
    // ----------------------------------------------------------------
    private async Task RegistrarMovimientosStockVentaAsync(Venta venta, int? usuarioId)
    {
        var hoy = DateTime.Now.Date;

        foreach (var detalle in venta.Detalles)
        {
            if (detalle.ProductoId.HasValue)
            {
                // Producto suelto: un movimiento EGR_VTA
                await _movimientoService.RegistrarMovimientoAsync(new CrearMovimientoDto(
                    CodigoAccionId: 1, // EGR_VTA
                    ProductoId: detalle.ProductoId.Value,
                    LocalId: venta.LocalId,
                    Cantidad: detalle.Cantidad,
                    PrecioUnitario: detalle.PrecioUnitario,
                    FechaMovimiento: hoy,
                    Observaciones: $"Venta {venta.NumeroVenta}"),
                    usuarioId);
            }
            else if (detalle.ComboId.HasValue)
            {
                // Combo: expandir sus productos y registrar uno por cada componente
                var combo = await _comboRepo.GetByIdWithDetallesAsync(detalle.ComboId.Value);
                if (combo?.Detalles != null && combo.Detalles.Any())
                {
                    foreach (var componenteCombo in combo.Detalles)
                    {
                        var cantidadTotal = detalle.Cantidad * componenteCombo.Cantidad;
                        await _movimientoService.RegistrarMovimientoAsync(new CrearMovimientoDto(
                            CodigoAccionId: 1, // EGR_VTA
                            ProductoId: componenteCombo.ProductoId,
                            LocalId: venta.LocalId,
                            Cantidad: cantidadTotal,
                            PrecioUnitario: 0m,
                            FechaMovimiento: hoy,
                            Observaciones: $"Venta {venta.NumeroVenta} - Combo"),
                            usuarioId);
                    }
                }
            }
        }
    }

    private async Task RegistrarMovimientoCajaVentaAsync(Venta venta, int? usuarioId)
    {
        var hoy = DateTime.Now.Date;

        await _movimientoService.RegistrarMovimientoAsync(new CrearMovimientoDto(
            CodigoAccionId: 2, // ING_VTA
            ProductoId: null,
            LocalId: venta.LocalId,
            Cantidad: 1,
            PrecioUnitario: venta.Total,
            FechaMovimiento: hoy,
            Observaciones: $"Venta {venta.NumeroVenta}"),
            usuarioId);
    }

    // ----------------------------------------------------------------
    // Mapeo a DTO
    // ----------------------------------------------------------------
    private static VentaDto ToDto(Venta v) => new(
        Id: v.Id,
        NumeroVenta: v.NumeroVenta,
        Fecha: v.Fecha,
        TipoVenta: v.TipoVenta,
        ClienteId: v.ClienteId,
        NombreCliente: v.NombreCliente,
        TelefonoCliente: v.TelefonoCliente,
        LocalId: v.LocalId,
        LocalNombre: v.Local?.Nombre ?? string.Empty,
        PedidoId: v.PedidoId,
        NumeroTicket: v.Pedido?.NumeroTicket,
        FormaPagoId: v.FormaPagoId,
        FormaPagoNombre: v.FormaPago?.Nombre,
        Subtotal: v.Subtotal,
        Descuento: v.Descuento,
        Recargo: v.Recargo,
        Total: v.Total,
        EstaPago: v.EstaPago,
        UsuarioId: v.UsuarioId,
        UsuarioNombre: v.Usuario?.NombreCompleto,
        Observaciones: v.Observaciones,
        Detalles: v.Detalles.Select(d => new VentaDetalleDto(
            Id: d.Id,
            ProductoId: d.ProductoId,
            ComboId: d.ComboId,
            Descripcion: d.Descripcion,
            Cantidad: d.Cantidad,
            PrecioUnitario: d.PrecioUnitario,
            Subtotal: d.Subtotal,
            Notas: d.Notas)).ToList(),
        Pagos: v.Pagos.Any()
            ? v.Pagos.Select(p => new PagoVentaDto(
                Id: p.Id,
                FormaPagoId: p.FormaPagoId,
                FormaPagoNombre: p.FormaPago?.Nombre ?? string.Empty,
                Monto: p.Monto,
                PorcentajeRecargo: p.PorcentajeRecargo,
                Recargo: p.Recargo,
                TotalACobrar: p.TotalACobrar)).ToList()
            : null);
}
