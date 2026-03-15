using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BurgerShop.Application.Notificaciones;

[Authorize]
public class NotificacionHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var repartidorId = Context.User?.FindFirstValue("repartidorId");

        // Agregar al grupo según rol
        if (role == "Administrador" || role == "Local")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admin");
        }

        if (!string.IsNullOrEmpty(repartidorId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Repartidor-{repartidorId}");
        }

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User-{userId}");
        }

        await base.OnConnectedAsync();
    }

}
