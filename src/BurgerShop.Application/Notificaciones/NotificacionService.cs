using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Notificaciones;

public class NotificacionService : INotificacionService
{
    private readonly IHubContext<NotificacionHub> _hub;
    private readonly ILogger<NotificacionService> _logger;

    public NotificacionService(IHubContext<NotificacionHub> hub, ILogger<NotificacionService> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task NotificarNuevoPedidoAsync(int pedidoId, string numeroTicket, string tipo, int? localId = null)
    {
        try
        {
            await _hub.Clients.Group("Admin").SendAsync("NuevoPedido", new
            {
                pedidoId,
                numeroTicket,
                tipo,
                localId,
                mensaje = $"Nuevo pedido {numeroTicket} ({tipo})",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarNuevoPedidoAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarPedidoAsignadoAsync(int repartidorId, int pedidoId, string numeroTicket, string? direccion)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarPedidoAsignadoAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarPedidoEntregadoAsync(int pedidoId, string numeroTicket, string? repartidorNombre, int? localId = null)
    {
        try
        {
            await _hub.Clients.Group("Admin").SendAsync("PedidoEntregado", new
            {
                pedidoId,
                numeroTicket,
                repartidorNombre,
                localId,
                mensaje = $"Pedido {numeroTicket} entregado por {repartidorNombre ?? "N/A"}",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarPedidoEntregadoAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarPedidoCanceladoAsync(int pedidoId, string numeroTicket, int? localId = null)
    {
        try
        {
            await _hub.Clients.Group("Admin").SendAsync("PedidoCancelado", new
            {
                pedidoId,
                numeroTicket,
                localId,
                mensaje = $"Pedido {numeroTicket} fue cancelado",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarPedidoCanceladoAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarMensajeParaRepartidorAsync(int repartidorId, string texto)
    {
        try
        {
            await _hub.Clients.Group($"Repartidor-{repartidorId}").SendAsync("NuevoMensaje", new
            {
                esDeAdmin = true,
                texto,
                mensaje = "Nuevo mensaje del administrador",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarMensajeParaRepartidorAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarMensajeParaAdminAsync(int repartidorId, string repartidorNombre, string texto, int? localId = null)
    {
        try
        {
            await _hub.Clients.Group("Admin").SendAsync("NuevoMensaje", new
            {
                esDeAdmin = false,
                repartidorId,
                repartidorNombre,
                texto,
                localId,
                mensaje = $"Nuevo mensaje de {repartidorNombre}",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarMensajeParaAdminAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarRepartoIniciadoAsync(IEnumerable<(int RepartidorId, int CantidadPedidos)> asignaciones)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarRepartoIniciadoAsync), ex.Message);
            throw;
        }
    }

    public async Task NotificarCambioEstadoAsync(int pedidoId, string numeroTicket, string nuevoEstado, int? localId = null)
    {
        try
        {
            await _hub.Clients.Group("Admin").SendAsync("CambioEstado", new
            {
                pedidoId,
                numeroTicket,
                nuevoEstado,
                localId,
                mensaje = $"Pedido {numeroTicket} cambió a {nuevoEstado}",
                fecha = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(NotificarCambioEstadoAsync), ex.Message);
            throw;
        }
    }
}
