using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Ventas;

public class Pedido
{
    public int Id { get; set; }
    public string NumeroTicket { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public TipoPedido Tipo { get; set; }
    public EstadoPedido Estado { get; set; } = EstadoPedido.Pendiente;

    public int? ClienteId { get; set; }
    public string? NombreCliente { get; set; }
    public string? TelefonoCliente { get; set; }
    public string? DireccionEntrega { get; set; }
    public int? ZonaId { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Total { get; set; }

    public int? RepartidorId { get; set; }
    public DateTime? FechaAsignacion { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public string? NotasEntrega { get; set; }

    public Cliente? Cliente { get; set; }
    public Zona? Zona { get; set; }
    public Repartidor? Repartidor { get; set; }
    public ICollection<LineaPedido> Lineas { get; set; } = new List<LineaPedido>();
}
