namespace BurgerShop.Application.Notificaciones;

public interface INotificacionService
{
    /// <summary>Notifica a Admin/Local que se creó un nuevo pedido de delivery.</summary>
    Task NotificarNuevoPedidoAsync(int pedidoId, string numeroTicket, string tipo, int? localId = null);

    /// <summary>Notifica al repartidor que le asignaron un pedido.</summary>
    Task NotificarPedidoAsignadoAsync(int repartidorId, int pedidoId, string numeroTicket, string? direccion);

    /// <summary>Notifica a Admin que un pedido fue entregado.</summary>
    Task NotificarPedidoEntregadoAsync(int pedidoId, string numeroTicket, string? repartidorNombre, int? localId = null);

    /// <summary>Notifica a Admin que un pedido fue cancelado.</summary>
    Task NotificarPedidoCanceladoAsync(int pedidoId, string numeroTicket, int? localId = null);

    /// <summary>Notifica al repartidor que tiene un mensaje nuevo del admin.</summary>
    Task NotificarMensajeParaRepartidorAsync(int repartidorId, string texto);

    /// <summary>Notifica a Admin que un repartidor envió un mensaje.</summary>
    Task NotificarMensajeParaAdminAsync(int repartidorId, string repartidorNombre, string texto, int? localId = null);

    /// <summary>Notifica a los repartidores que empezó el reparto (bulk).</summary>
    Task NotificarRepartoIniciadoAsync(IEnumerable<(int RepartidorId, int CantidadPedidos)> asignaciones);

    /// <summary>Notifica cambio de estado de un pedido.</summary>
    Task NotificarCambioEstadoAsync(int pedidoId, string numeroTicket, string nuevoEstado, int? localId = null);
}
