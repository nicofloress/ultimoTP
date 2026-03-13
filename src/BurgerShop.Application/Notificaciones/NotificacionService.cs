using Microsoft.AspNetCore.SignalR;

namespace BurgerShop.Application.Notificaciones;

public class NotificacionService : INotificacionService
{
    private readonly IHubContext<NotificacionHub> _hub;

    public NotificacionService(IHubContext<NotificacionHub> hub)
    {
        _hub = hub;
    }

    public async Task NotificarNuevoPedidoAsync(int pedidoId, string numeroTicket, string tipo)
    {
        await _hub.Clients.Group("Admin").SendAsync("NuevoPedido", new
        {
            pedidoId,
            numeroTicket,
            tipo,
            mensaje = $"Nuevo pedido {numeroTicket} ({tipo})",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarPedidoAsignadoAsync(int repartidorId, int pedidoId, string numeroTicket, string? direccion)
    {
        await _hub.Clients.Group($"Repartidor-{repartidorId}").SendAsync("PedidoAsignado", new
        {
            pedidoId,
            numeroTicket,
            direccion,
            mensaje = $"Te asignaron el pedido {numeroTicket}",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarPedidoEntregadoAsync(int pedidoId, string numeroTicket, string? repartidorNombre)
    {
        await _hub.Clients.Group("Admin").SendAsync("PedidoEntregado", new
        {
            pedidoId,
            numeroTicket,
            repartidorNombre,
            mensaje = $"Pedido {numeroTicket} entregado por {repartidorNombre ?? "N/A"}",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarPedidoCanceladoAsync(int pedidoId, string numeroTicket)
    {
        await _hub.Clients.Group("Admin").SendAsync("PedidoCancelado", new
        {
            pedidoId,
            numeroTicket,
            mensaje = $"Pedido {numeroTicket} fue cancelado",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarMensajeParaRepartidorAsync(int repartidorId, string texto)
    {
        await _hub.Clients.Group($"Repartidor-{repartidorId}").SendAsync("NuevoMensaje", new
        {
            esDeAdmin = true,
            texto,
            mensaje = "Nuevo mensaje del administrador",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarMensajeParaAdminAsync(int repartidorId, string repartidorNombre, string texto)
    {
        await _hub.Clients.Group("Admin").SendAsync("NuevoMensaje", new
        {
            esDeAdmin = false,
            repartidorId,
            repartidorNombre,
            texto,
            mensaje = $"Nuevo mensaje de {repartidorNombre}",
            fecha = DateTime.Now
        });
    }

    public async Task NotificarRepartoIniciadoAsync(IEnumerable<(int RepartidorId, int CantidadPedidos)> asignaciones)
    {
        foreach (var (repartidorId, cantidadPedidos) in asignaciones)
        {
            await _hub.Clients.Group($"Repartidor-{repartidorId}").SendAsync("RepartoIniciado", new
            {
                cantidadPedidos,
                mensaje = $"Se te asignaron {cantidadPedidos} pedidos para repartir",
                fecha = DateTime.Now
            });
        }
    }

    public async Task NotificarCambioEstadoAsync(int pedidoId, string numeroTicket, string nuevoEstado)
    {
        await _hub.Clients.Group("Admin").SendAsync("CambioEstado", new
        {
            pedidoId,
            numeroTicket,
            nuevoEstado,
            mensaje = $"Pedido {numeroTicket} cambió a {nuevoEstado}",
            fecha = DateTime.Now
        });
    }
}
