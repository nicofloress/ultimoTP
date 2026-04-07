using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;
using BurgerShop.Domain.Interfaces.Finanzas;

namespace BurgerShop.Application.Ventas.Services;

public class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _pedidoRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IComboRepository _comboRepo;
    private readonly IRepository<FormaPago> _formaPagoRepo;
    private readonly ICierreCajaRepository _cajaRepo;
    private readonly IMovimientoService _movimientoService;

    public PedidoService(
        IPedidoRepository pedidoRepo,
        IProductoRepository productoRepo,
        IComboRepository comboRepo,
        IRepository<FormaPago> formaPagoRepo,
        ICierreCajaRepository cajaRepo,
        IMovimientoService movimientoService)
    {
        _pedidoRepo = pedidoRepo;
        _productoRepo = productoRepo;
        _comboRepo = comboRepo;
        _formaPagoRepo = formaPagoRepo;
        _cajaRepo = cajaRepo;
        _movimientoService = movimientoService;
    }

    public async Task<PedidoDto> CreateAsync(CrearPedidoDto dto)
    {
        var ahora = DateTime.Now;
        var numero = await _pedidoRepo.GetSiguienteNumeroTicketAsync(ahora);
        var ticket = $"T-{ahora:yyyyMMdd}-{numero:D4}";

        if (dto.FechaProgramada.HasValue)
        {
            var fechaProg = dto.FechaProgramada.Value.Date;
            var hoyDate = ahora.Date;
            var maxFecha = hoyDate.AddDays(14);
            if (fechaProg < hoyDate || fechaProg > maxFecha)
                throw new InvalidOperationException(
                    "La fecha programada debe ser desde hoy y no mayor a 14 días.");
        }

        var pedido = new Pedido
        {
            NumeroTicket = ticket,
            FechaCreacion = ahora,
            Tipo = dto.Tipo,
            Estado = EstadoPedido.Pendiente,
            ClienteId = dto.ClienteId,
            NombreCliente = dto.NombreCliente,
            TelefonoCliente = dto.TelefonoCliente,
            DireccionEntrega = dto.DireccionEntrega,
            ZonaId = dto.ZonaId,
            Descuento = dto.Descuento,
            NotaInterna = dto.NotaInterna,
            TipoFactura = dto.TipoFactura,
            FechaProgramada = dto.FechaProgramada,
            EstaPago = dto.EstaPago,
            LocalId = dto.LocalId
        };

        decimal subtotal = 0;
        foreach (var linea in dto.Lineas)
        {
            string descripcion;
            if (linea.ProductoId.HasValue)
            {
                var producto = await _productoRepo.GetByIdAsync(linea.ProductoId.Value);
                descripcion = producto?.Nombre ?? "Producto";
            }
            else if (linea.ComboId.HasValue)
            {
                var combo = await _comboRepo.GetByIdAsync(linea.ComboId.Value);
                descripcion = combo?.Nombre ?? "Combo";
            }
            else
            {
                descripcion = "Item";
            }

            var lineaSubtotal = linea.PrecioUnitario * linea.Cantidad;
            pedido.Lineas.Add(new LineaPedido
            {
                ProductoId = linea.ProductoId,
                ComboId = linea.ComboId,
                Descripcion = descripcion,
                Cantidad = linea.Cantidad,
                PrecioUnitario = linea.PrecioUnitario,
                Subtotal = lineaSubtotal,
                Notas = linea.Notas
            });
            subtotal += lineaSubtotal;
        }

        pedido.Subtotal = subtotal;

        if (dto.Pagos is { Count: > 0 })
        {
            // Modo pago dividido: múltiples formas de pago
            decimal recargoTotal = 0;
            pedido.FormaPagoId = null;

            foreach (var pagoDto in dto.Pagos)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                var recargoPago = pagoDto.Monto * porcentaje / 100m;
                var totalACobrar = pagoDto.Monto + recargoPago;

                pedido.Pagos.Add(new PagoPedido
                {
                    FormaPagoId = pagoDto.FormaPagoId,
                    Monto = pagoDto.Monto,
                    PorcentajeRecargo = porcentaje,
                    Recargo = recargoPago,
                    TotalACobrar = totalACobrar
                });

                recargoTotal += recargoPago;
            }

            pedido.Recargo = recargoTotal;
            pedido.Total = subtotal - dto.Descuento + recargoTotal;
        }
        else
        {
            // Modo pago simple: una sola forma de pago
            pedido.FormaPagoId = dto.FormaPagoId;
            decimal recargo = 0;

            if (dto.FormaPagoId.HasValue)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                {
                    recargo = (subtotal - dto.Descuento) * formaPago.PorcentajeRecargo / 100m;
                }
            }

            pedido.Recargo = recargo;
            pedido.Total = subtotal - dto.Descuento + recargo;
        }

        // Si es Domicilio con zona, verificar si ya hay reparto activo en esa zona
        if (dto.Tipo == TipoPedido.Domicilio && dto.ZonaId.HasValue)
        {
            var repartoActivo = await _pedidoRepo.GetRepartoZonaActivoHoyAsync(dto.ZonaId.Value);
            if (repartoActivo != null)
            {
                pedido.RepartidorId = repartoActivo.RepartidorId;
                pedido.Estado = EstadoPedido.Asignado;
                pedido.FechaAsignacion = ahora;
                pedido.RepartoZonaId = repartoActivo.Id;
            }
        }

        // Asignar caja abierta si existe
        var cajaAbierta = await _cajaRepo.GetCajaAbiertaAsync();
        if (cajaAbierta is not null)
        {
            pedido.CierreCajaId = cajaAbierta.Id;
        }

        await _pedidoRepo.AddAsync(pedido);
        await _pedidoRepo.SaveChangesAsync();

        // Si se auto-asignó, incrementar contador del reparto
        if (pedido.Estado == EstadoPedido.Asignado && pedido.ZonaId.HasValue)
        {
            await _pedidoRepo.IncrementarTotalPedidosRepartoAsync(pedido.ZonaId.Value);
        }

        var created = await _pedidoRepo.GetByIdWithLineasAsync(pedido.Id);

        // Ventas POS (ParaLlevar): generar movimientos de stock + caja inmediatamente
        if (dto.Tipo == TipoPedido.ParaLlevar)
        {
            try
            {
                await _movimientoService.RegistrarMovimientosVentaStockAsync(pedido.Id, 1, null);
                // Solo generar ingreso de caja si está pago (no es cuenta corriente)
                if (dto.EstaPago)
                    await _movimientoService.RegistrarMovimientosVentaCajaAsync(pedido.Id, 1, null);
            }
            catch
            {
                // No bloquear la creación del pedido si falla el registro de movimientos
            }
        }

        return ToDto(created!);
    }

    public async Task<PedidoDto?> UpdateAsync(int id, ActualizarPedidoDto dto)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        if (pedido.Estado != EstadoPedido.Pendiente && pedido.Estado != EstadoPedido.Asignado)
            throw new InvalidOperationException(
                $"No se puede editar un pedido en estado '{pedido.Estado}'. Solo se permite en estado Pendiente o Asignado.");

        // En estado Asignado solo se permite editar teléfono, estaPago y formaPago
        if (pedido.Estado == EstadoPedido.Asignado)
        {
            pedido.TelefonoCliente = dto.TelefonoCliente;
            pedido.EstaPago = dto.EstaPago;

            // Recalcular recargo si cambia la forma de pago
            if (dto.Pagos is { Count: > 0 })
            {
                pedido.Pagos.Clear();
                decimal recargoTotal = 0;
                pedido.FormaPagoId = null;

                foreach (var pagoDto in dto.Pagos)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                    var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                    var recargoPago = pagoDto.Monto * porcentaje / 100m;
                    var totalACobrar = pagoDto.Monto + recargoPago;

                    pedido.Pagos.Add(new PagoPedido
                    {
                        FormaPagoId = pagoDto.FormaPagoId,
                        Monto = pagoDto.Monto,
                        PorcentajeRecargo = porcentaje,
                        Recargo = recargoPago,
                        TotalACobrar = totalACobrar
                    });

                    recargoTotal += recargoPago;
                }

                pedido.Recargo = recargoTotal;
                pedido.Total = pedido.Subtotal - pedido.Descuento + recargoTotal;
            }
            else
            {
                pedido.Pagos.Clear();
                pedido.FormaPagoId = dto.FormaPagoId;
                decimal recargo = 0;

                if (dto.FormaPagoId.HasValue)
                {
                    var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                    if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                    {
                        recargo = (pedido.Subtotal - pedido.Descuento) * formaPago.PorcentajeRecargo / 100m;
                    }
                }

                pedido.Recargo = recargo;
                pedido.Total = pedido.Subtotal - pedido.Descuento + recargo;
            }

            _pedidoRepo.Update(pedido);
            await _pedidoRepo.SaveChangesAsync();

            var updatedAsignado = await _pedidoRepo.GetByIdWithLineasAsync(pedido.Id);
            return ToDto(updatedAsignado!);
        }

        if (dto.FechaProgramada.HasValue)
        {
            var fechaProg = dto.FechaProgramada.Value.Date;
            var manana = DateTime.Today.AddDays(1);
            var maxFecha = DateTime.Today.AddDays(14);
            if (fechaProg < manana || fechaProg > maxFecha)
                throw new InvalidOperationException(
                    "La fecha programada debe ser a partir de mañana y no mayor a 14 días desde hoy.");
        }

        pedido.NombreCliente = dto.NombreCliente;
        pedido.TelefonoCliente = dto.TelefonoCliente;
        pedido.DireccionEntrega = dto.DireccionEntrega;
        pedido.ZonaId = dto.ZonaId;
        pedido.Descuento = dto.Descuento;
        pedido.NotaInterna = dto.NotaInterna;
        pedido.TipoFactura = dto.TipoFactura;
        pedido.FechaProgramada = dto.FechaProgramada;
        pedido.EstaPago = dto.EstaPago;

        // Reemplazar líneas existentes con las nuevas
        pedido.Lineas.Clear();
        decimal subtotal = 0;

        foreach (var linea in dto.Lineas)
        {
            string descripcion;
            if (linea.ProductoId.HasValue)
            {
                var producto = await _productoRepo.GetByIdAsync(linea.ProductoId.Value);
                descripcion = producto?.Nombre ?? "Producto";
            }
            else if (linea.ComboId.HasValue)
            {
                var combo = await _comboRepo.GetByIdAsync(linea.ComboId.Value);
                descripcion = combo?.Nombre ?? "Combo";
            }
            else
            {
                descripcion = "Item";
            }

            var lineaSubtotal = linea.PrecioUnitario * linea.Cantidad;
            pedido.Lineas.Add(new LineaPedido
            {
                ProductoId = linea.ProductoId,
                ComboId = linea.ComboId,
                Descripcion = descripcion,
                Cantidad = linea.Cantidad,
                PrecioUnitario = linea.PrecioUnitario,
                Subtotal = lineaSubtotal,
                Notas = linea.Notas
            });
            subtotal += lineaSubtotal;
        }

        pedido.Subtotal = subtotal;

        if (dto.Pagos is { Count: > 0 })
        {
            // Modo pago dividido: múltiples formas de pago
            pedido.Pagos.Clear();
            decimal recargoTotal = 0;
            pedido.FormaPagoId = null;

            foreach (var pagoDto in dto.Pagos)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(pagoDto.FormaPagoId);
                var porcentaje = formaPago?.PorcentajeRecargo ?? 0m;
                var recargoPago = pagoDto.Monto * porcentaje / 100m;
                var totalACobrar = pagoDto.Monto + recargoPago;

                pedido.Pagos.Add(new PagoPedido
                {
                    FormaPagoId = pagoDto.FormaPagoId,
                    Monto = pagoDto.Monto,
                    PorcentajeRecargo = porcentaje,
                    Recargo = recargoPago,
                    TotalACobrar = totalACobrar
                });

                recargoTotal += recargoPago;
            }

            pedido.Recargo = recargoTotal;
            pedido.Total = subtotal - dto.Descuento + recargoTotal;
        }
        else
        {
            // Modo pago simple: una sola forma de pago
            pedido.Pagos.Clear();
            pedido.FormaPagoId = dto.FormaPagoId;
            decimal recargo = 0;

            if (dto.FormaPagoId.HasValue)
            {
                var formaPago = await _formaPagoRepo.GetByIdAsync(dto.FormaPagoId.Value);
                if (formaPago is not null && formaPago.PorcentajeRecargo > 0)
                {
                    recargo = (subtotal - dto.Descuento) * formaPago.PorcentajeRecargo / 100m;
                }
            }

            pedido.Recargo = recargo;
            pedido.Total = subtotal - dto.Descuento + recargo;
        }

        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();

        var updated = await _pedidoRepo.GetByIdWithLineasAsync(pedido.Id);
        return ToDto(updated!);
    }

    public async Task<PedidoDto?> GetByIdAsync(int id)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        return pedido is null ? null : ToDto(pedido);
    }

    public async Task<IEnumerable<PedidoDto>> GetByFechaAsync(DateTime fecha)
    {
        var pedidos = await _pedidoRepo.GetByFechaAsync(fecha);
        return pedidos.Select(ToDto);
    }

    public async Task<IEnumerable<PedidoDto>> GetByRangoFechasAsync(DateTime desde, DateTime hasta)
    {
        var pedidos = await _pedidoRepo.GetByRangoFechasAsync(desde, hasta);
        return pedidos.Select(ToDto);
    }

    public async Task<IEnumerable<PedidoDto>> GetByEstadoAsync(EstadoPedido estado)
    {
        var pedidos = await _pedidoRepo.GetByEstadoAsync(estado);
        return pedidos.Select(ToDto);
    }

    public async Task<PedidoDto?> CambiarEstadoAsync(int id, EstadoPedido nuevoEstado)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        pedido.Estado = nuevoEstado;
        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();
        return ToDto(pedido);
    }

    public async Task<PedidoDto?> CancelarAsync(int id, string motivoCancelacion)
    {
        if (string.IsNullOrWhiteSpace(motivoCancelacion))
            throw new InvalidOperationException("El motivo de cancelación es obligatorio.");

        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        pedido.Estado = EstadoPedido.Cancelado;
        pedido.MotivoCancelacion = motivoCancelacion.Trim();
        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();

        // Incrementar contador en RepartoZona
        if (pedido.ZonaId.HasValue)
            await _pedidoRepo.IncrementarContadorRepartoAsync(pedido.ZonaId.Value, EstadoPedido.Cancelado);

        return ToDto(pedido);
    }

    public async Task<PedidoDto?> MarcarNoEntregadoAsync(int id, string motivo)
    {
        if (string.IsNullOrWhiteSpace(motivo))
            throw new InvalidOperationException("El motivo de no entrega es obligatorio.");

        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        if (pedido.Estado != EstadoPedido.EnCamino)
            throw new InvalidOperationException("Solo se puede marcar como no entregado un pedido en camino.");

        pedido.Estado = EstadoPedido.NoEntregado;
        pedido.MotivoCancelacion = motivo.Trim();
        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();

        // Incrementar contador en RepartoZona
        if (pedido.ZonaId.HasValue)
            await _pedidoRepo.IncrementarContadorRepartoAsync(pedido.ZonaId.Value, EstadoPedido.NoEntregado);

        return ToDto(pedido);
    }

    public async Task<TicketDto?> GetTicketAsync(int id)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        var pagos = pedido.Pagos.Any()
            ? pedido.Pagos.Select(MapPagoPedidoDto).ToList()
            : null;

        return new TicketDto(
            pedido.NumeroTicket, pedido.FechaCreacion, pedido.Tipo,
            pedido.NombreCliente, pedido.DireccionEntrega, pedido.Zona?.Nombre,
            pedido.Lineas.Select(l => new LineaPedidoDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList(),
            pedido.Subtotal, pedido.Descuento, pedido.Recargo, pedido.Total,
            pedido.FormaPago?.Nombre,
            pedido.NotaInterna,
            pedido.TipoFactura,
            pagos);
    }

    public async Task<IEnumerable<PedidoDto>> GetPendientesEntregaAsync()
    {
        var pedidos = await _pedidoRepo.GetPendientesEntregaAsync();
        return pedidos.Select(ToDto);
    }

    public async Task<PedidoDto?> AsignarRepartidorAsync(int pedidoId, int repartidorId)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        if (pedido is null) return null;

        pedido.RepartidorId = repartidorId;
        pedido.Estado = EstadoPedido.Asignado;
        pedido.FechaAsignacion = DateTime.Now;
        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();

        var updated = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        return ToDto(updated!);
    }

    public async Task<IEnumerable<PedidoDto>> GetEntregasRepartidorHoyAsync(int repartidorId)
    {
        var pedidos = await _pedidoRepo.GetByRepartidorHoyAsync(repartidorId);
        return pedidos.Select(ToDto);
    }

    public async Task<PedidoDto?> MarcarEnCaminoAsync(int pedidoId)
    {
        return await CambiarEstadoAsync(pedidoId, EstadoPedido.EnCamino);
    }

    public async Task<PedidoDto?> MarcarEntregadoAsync(int pedidoId, MarcarEntregadoDto dto)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        if (pedido is null) return null;

        pedido.Estado = EstadoPedido.Entregado;
        pedido.FechaEntrega = DateTime.Now;
        pedido.NotasEntrega = dto.Notas;

        // Si se informa forma de pago al entregar, actualizar pago
        if (dto.FormaPagoId.HasValue)
        {
            pedido.FormaPagoId = dto.FormaPagoId.Value;
            pedido.EstaPago = true;
        }

        // Guardar comprobante de transferencia si viene
        if (!string.IsNullOrEmpty(dto.ComprobanteBase64))
        {
            pedido.ComprobanteEntrega = dto.ComprobanteBase64;
        }

        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();

        // Incrementar contador en RepartoZona
        if (pedido.ZonaId.HasValue)
            await _pedidoRepo.IncrementarContadorRepartoAsync(pedido.ZonaId.Value, EstadoPedido.Entregado);

        return ToDto(pedido);
    }

    public async Task<IEnumerable<PedidoDto>> GetListosParaRepartoHoyAsync()
    {
        var pedidos = await _pedidoRepo.GetListosParaRepartoHoyAsync();
        return pedidos.Select(ToDto);
    }

    public async Task<IEnumerable<PedidoDto>> EmpezarRepartoAsync(EmpezarRepartoDto dto)
    {
        // Traer todos los pedidos del día tipo Domicilio con zona
        var pedidos = await _pedidoRepo.GetListosParaRepartoHoyAsync();
        // Solo trabajar con pedidos que aún no fueron despachados
        var pedidosList = pedidos
            .Where(p => p.Estado == EstadoPedido.Pendiente)
            .ToList();

        if (!pedidosList.Any())
            return Enumerable.Empty<PedidoDto>();

        var ahora = DateTime.Now;

        foreach (var asignacion in dto.Asignaciones)
        {
            // Obtener los pedidos de esta zona específica
            var pedidosDeZona = pedidosList
                .Where(p => p.ZonaId == asignacion.ZonaId)
                .ToList();

            // Crear/reutilizar registro RepartoZona ANTES de asignar pedidos
            // para poder asociar el RepartoZonaId en cada pedido
            RepartoZona? repartoZona = null;
            if (pedidosDeZona.Any())
            {
                repartoZona = await _pedidoRepo.CrearRepartoZonaAsync(
                    asignacion.ZonaId,
                    asignacion.RepartidorId,
                    pedidosDeZona.Count);
            }

            foreach (var pedido in pedidosDeZona)
            {
                pedido.RepartidorId = asignacion.RepartidorId;
                pedido.Estado = EstadoPedido.Asignado;
                pedido.FechaAsignacion = ahora;
                if (repartoZona != null)
                    pedido.RepartoZonaId = repartoZona.Id;
                _pedidoRepo.Update(pedido);
            }
        }

        await _pedidoRepo.SaveChangesAsync();

        // Retornar los pedidos actualizados mapeados a DTO
        var pedidosActualizados = pedidosList
            .Where(p => dto.Asignaciones.Any(a => a.ZonaId == p.ZonaId))
            .ToList();

        return pedidosActualizados.Select(ToDto);
    }

    public async Task<int> PrepararTodosAsync()
    {
        // Ya no se usa EnPreparacion, este método no tiene efecto
        return 0;
    }

    public async Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId)
    {
        await _pedidoRepo.FinalizarRepartoZonaAsync(zonaId, repartidorId);

        // Generar movimientos de stock (EGR_VTA) para todos los pedidos entregados del reparto
        try
        {
            var repartosZona = await _pedidoRepo.GetRepartosZonaByRepartidorHoyAsync(repartidorId);
            var reparto = repartosZona.FirstOrDefault(r => r.ZonaId == zonaId);
            if (reparto != null)
            {
                var pedidos = await _pedidoRepo.GetByRepartidorHoyAsync(repartidorId);
                var entregados = pedidos
                    .Where(p => p.RepartoZonaId == reparto.Id && p.Estado == EstadoPedido.Entregado)
                    .ToList();

                foreach (var pedido in entregados)
                {
                    try
                    {
                        await _movimientoService.RegistrarMovimientosVentaStockAsync(pedido.Id, 1, null);
                    }
                    catch
                    {
                        // No bloquear la finalización si falla un movimiento individual
                    }
                }
            }
        }
        catch
        {
            // No bloquear la finalización del reparto
        }
    }

    public async Task<PedidoStatsDto> GetStatsAsync(DateTime fecha)
    {
        var hoy = DateTime.Today;
        var ayer = hoy.AddDays(-1);
        var hace7Dias = hoy.AddDays(-6);           // hoy inclusive = 7 días
        var hace14Dias = hoy.AddDays(-13);          // 7 días anteriores
        var hace8Dias = hoy.AddDays(-7);            // inicio del período anterior
        var mismoHaceUnAnio = hoy.AddYears(-1);

        // Conteos comparativos (siempre relativos a hoy)
        var pedidosHoy = await _pedidoRepo.GetCountByFechaAsync(hoy);
        var pedidosAyer = await _pedidoRepo.GetCountByFechaAsync(ayer);
        var pedidosUltimos7Dias = await _pedidoRepo.GetCountByRangoAsync(hace7Dias, hoy);
        var pedidos7DiasAnteriores = await _pedidoRepo.GetCountByRangoAsync(hace14Dias, hace8Dias);
        var pedidosAnioAnterior = await _pedidoRepo.GetCountByFechaAsync(mismoHaceUnAnio);

        // Totales para la fecha seleccionada
        var (totalBruto, totalPedidosFecha) = await _pedidoRepo.GetTotalesByFechaAsync(fecha);
        var ticketPromedio = totalPedidosFecha > 0 ? totalBruto / totalPedidosFecha : 0m;

        // Cálculo de porcentajes: ((actual - anterior) / anterior) * 100. Si anterior = 0 → 0
        static decimal Porcentaje(int actual, int anterior) =>
            anterior == 0 ? 0m : Math.Round(((decimal)(actual - anterior) / anterior) * 100m, 1);

        return new PedidoStatsDto(
            PedidosHoy: pedidosHoy,
            PedidosAyer: pedidosAyer,
            PorcentajeVariacionAyer: Porcentaje(pedidosHoy, pedidosAyer),
            PedidosUltimos7Dias: pedidosUltimos7Dias,
            PorcentajeVariacion7Dias: Porcentaje(pedidosUltimos7Dias, pedidos7DiasAnteriores),
            PedidosAnioAnterior: pedidosAnioAnterior,
            PorcentajeVariacionAnio: Porcentaje(pedidosHoy, pedidosAnioAnterior),
            TotalPedidosFecha: totalPedidosFecha,
            TicketPromedio: Math.Round(ticketPromedio, 2),
            TotalBruto: Math.Round(totalBruto, 2));
    }

    public async Task<IEnumerable<PedidoDto>> GetPedidosDepositoAsync(int? localId)
    {
        var desde = DateTime.Now.AddMinutes(-10);
        var pedidos = await _pedidoRepo.GetPedidosDepositoAsync(desde, localId);
        return pedidos.Select(ToDto);
    }

    private static PagoPedidoDto MapPagoPedidoDto(PagoPedido p) => new(
        p.Id, p.FormaPagoId, p.FormaPago?.Nombre ?? "",
        p.Monto, p.PorcentajeRecargo, p.Recargo, p.TotalACobrar);

    private static PedidoDto ToDto(Pedido p)
    {
        var pagos = p.Pagos.Any()
            ? p.Pagos.Select(MapPagoPedidoDto).ToList()
            : null;

        return new PedidoDto(
            p.Id, p.NumeroTicket, p.FechaCreacion, p.Tipo, p.Estado,
            p.ClienteId, p.NombreCliente, p.TelefonoCliente, p.DireccionEntrega,
            p.ZonaId, p.Zona?.Nombre,
            p.Subtotal, p.Descuento, p.Recargo, p.Total,
            p.FormaPagoId, p.FormaPago?.Nombre,
            p.RepartidorId, p.Repartidor?.Nombre,
            p.FechaAsignacion, p.FechaEntrega, p.NotasEntrega,
            p.NotaInterna,
            p.TipoFactura,
            p.FechaProgramada,
            p.FechaProgramada != null,
            p.EstaPago,
            p.LocalId,
            p.Local?.Nombre,
            p.Lineas.Select(l => new LineaPedidoDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList(),
            pagos,
            p.ComprobanteEntrega,
            p.MotivoCancelacion,
            p.RepartoZonaId);
    }
}
