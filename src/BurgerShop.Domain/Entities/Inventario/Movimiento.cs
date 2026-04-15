using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Entities.Inventario;

public class Movimiento
{
    public int Id { get; set; }
    public DateTime FechaMovimiento { get; set; } // Fecha real del movimiento
    public DateTime FechaProceso { get; set; }     // Fecha de inserción del registro
    public int CodigoAccionId { get; set; }
    public int? ProductoId { get; set; }
    public int LocalId { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal MontoTotal { get; set; }
    public int? VentaId { get; set; }
    public int? UsuarioId { get; set; }
    public int? CierreCajaId { get; set; }         // Caja a la que pertenece el movimiento (compras/egresos)
    public string? Observaciones { get; set; }

    // Navigation
    public CodigoAccion CodigoAccion { get; set; } = null!;
    public Producto? Producto { get; set; }
    public Local Local { get; set; } = null!;
    public Venta? Venta { get; set; }
    public Usuario? Usuario { get; set; }
    public CierreCaja? CierreCaja { get; set; }
}
