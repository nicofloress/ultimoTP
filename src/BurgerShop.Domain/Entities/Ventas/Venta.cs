using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Ventas;

public class Venta
{
    public int Id { get; set; }
    public string NumeroVenta { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
    public TipoVenta TipoVenta { get; set; }

    public int? ClienteId { get; set; }
    public string? NombreCliente { get; set; }
    public string? TelefonoCliente { get; set; }

    public int LocalId { get; set; }
    public int? PedidoId { get; set; }
    public int? FormaPagoId { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Recargo { get; set; }
    public decimal Total { get; set; }
    public bool EstaPago { get; set; }

    public int? UsuarioId { get; set; }
    public string? Observaciones { get; set; }

    // Navigations
    public Cliente? Cliente { get; set; }
    public Pedido? Pedido { get; set; }
    public FormaPago? FormaPago { get; set; }
    public Local Local { get; set; } = null!;
    public Usuario? Usuario { get; set; }
    public ICollection<VentaDetalle> Detalles { get; set; } = new List<VentaDetalle>();
    public ICollection<PagoVenta> Pagos { get; set; } = new List<PagoVenta>();
}
