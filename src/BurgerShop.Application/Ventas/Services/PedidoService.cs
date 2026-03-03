using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Ventas.Services;

public class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _pedidoRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IComboRepository _comboRepo;

    public PedidoService(IPedidoRepository pedidoRepo, IProductoRepository productoRepo, IComboRepository comboRepo)
    {
        _pedidoRepo = pedidoRepo;
        _productoRepo = productoRepo;
        _comboRepo = comboRepo;
    }

    public async Task<PedidoDto> CreateAsync(CrearPedidoDto dto)
    {
        var ahora = DateTime.Now;
        var numero = await _pedidoRepo.GetSiguienteNumeroTicketAsync(ahora);
        var ticket = $"T-{ahora:yyyyMMdd}-{numero:D4}";

        var pedido = new Pedido
        {
            NumeroTicket = ticket,
            FechaCreacion = ahora,
            Tipo = dto.Tipo,
            Estado = EstadoPedido.Pendiente,
            NombreCliente = dto.NombreCliente,
            TelefonoCliente = dto.TelefonoCliente,
            DireccionEntrega = dto.DireccionEntrega,
            ZonaId = dto.ZonaId,
            Descuento = dto.Descuento
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
        pedido.Total = subtotal - dto.Descuento;

        await _pedidoRepo.AddAsync(pedido);
        await _pedidoRepo.SaveChangesAsync();

        var created = await _pedidoRepo.GetByIdWithLineasAsync(pedido.Id);
        return ToDto(created!);
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

    public async Task<PedidoDto?> CancelarAsync(int id)
    {
        return await CambiarEstadoAsync(id, EstadoPedido.Cancelado);
    }

    public async Task<TicketDto?> GetTicketAsync(int id)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(id);
        if (pedido is null) return null;

        return new TicketDto(
            pedido.NumeroTicket, pedido.FechaCreacion, pedido.Tipo,
            pedido.NombreCliente, pedido.DireccionEntrega, pedido.Zona?.Nombre,
            pedido.Lineas.Select(l => new LineaPedidoDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList(),
            pedido.Subtotal, pedido.Descuento, pedido.Total);
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

    public async Task<PedidoDto?> MarcarEntregadoAsync(int pedidoId, string? notas)
    {
        var pedido = await _pedidoRepo.GetByIdWithLineasAsync(pedidoId);
        if (pedido is null) return null;

        pedido.Estado = EstadoPedido.Entregado;
        pedido.FechaEntrega = DateTime.Now;
        pedido.NotasEntrega = notas;
        _pedidoRepo.Update(pedido);
        await _pedidoRepo.SaveChangesAsync();
        return ToDto(pedido);
    }

    private static PedidoDto ToDto(Pedido p) => new(
        p.Id, p.NumeroTicket, p.FechaCreacion, p.Tipo, p.Estado,
        p.NombreCliente, p.TelefonoCliente, p.DireccionEntrega,
        p.ZonaId, p.Zona?.Nombre,
        p.Subtotal, p.Descuento, p.Total,
        p.RepartidorId, p.Repartidor?.Nombre,
        p.FechaAsignacion, p.FechaEntrega, p.NotasEntrega,
        p.Lineas.Select(l => new LineaPedidoDto(l.Id, l.ProductoId, l.ComboId, l.Descripcion, l.Cantidad, l.PrecioUnitario, l.Subtotal, l.Notas)).ToList());
}
