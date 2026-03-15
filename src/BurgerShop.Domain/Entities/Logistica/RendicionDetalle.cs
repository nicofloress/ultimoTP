using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Entities.Logistica;

public class RendicionDetalle
{
    public int Id { get; set; }
    public int RendicionId { get; set; }
    public RendicionRepartidor Rendicion { get; set; } = null!;
    public int PedidoId { get; set; }
    public Pedido Pedido { get; set; } = null!;
    public string NumeroTicket { get; set; } = "";
    public string Estado { get; set; } = ""; // Entregado, NoEntregado
    public string? FormaPago { get; set; } // Efectivo, Transferencia
    public decimal Total { get; set; }
}
