using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Ventas;

public class Venta
{
    public int Id { get; set; }
    public string NumeroTicket { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public TipoVenta Tipo { get; set; }
    public EstadoVenta Estado { get; set; } = EstadoVenta.Pendiente;
    public int? LocalId { get; set; }

    public int? ClienteId { get; set; }
    public string? NombreCliente { get; set; }
    public string? TelefonoCliente { get; set; }
    public string? DireccionEntrega { get; set; }
    public int? ZonaId { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Recargo { get; set; }
    public decimal Total { get; set; }
    public decimal MontoNeto { get; set; }
    public decimal MontoIVA { get; set; }

    public int? FormaPagoId { get; set; }
    public int? RepartidorId { get; set; }
    public int? CierreCajaId { get; set; }
    public DateTime? FechaProgramada { get; set; }
    public DateTime? FechaAsignacion { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public string? NotasEntrega { get; set; }
    public string? NotaInterna { get; set; }
    public TipoFactura TipoFactura { get; set; } = TipoFactura.FacturaB;
    public bool EstaPago { get; set; }
    public string? ComprobanteEntrega { get; set; }
    public string? MotivoCancelacion { get; set; }
    public int? RepartoZonaId { get; set; }

    // Campos incorporados de la Venta simple (mostrador)
    public int? UsuarioId { get; set; }
    public string? Observaciones { get; set; }
    public DateTime? FechaEnvioDeposito { get; set; }

    // Navigations
    public Cliente? Cliente { get; set; }
    public Local? Local { get; set; }
    public Zona? Zona { get; set; }
    public RepartoZona? RepartoZona { get; set; }
    public FormaPago? FormaPago { get; set; }
    public Repartidor? Repartidor { get; set; }
    public CierreCaja? CierreCaja { get; set; }
    public Usuario? Usuario { get; set; }
    public ICollection<LineaVenta> Lineas { get; set; } = new List<LineaVenta>();
    public ICollection<PagoVenta> Pagos { get; set; } = new List<PagoVenta>();
}
