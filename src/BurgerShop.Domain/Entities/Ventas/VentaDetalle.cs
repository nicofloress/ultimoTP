using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Entities.Ventas;

public class VentaDetalle
{
    public int Id { get; set; }
    public int VentaId { get; set; }
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; } = 1;
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notas { get; set; }

    public Venta Venta { get; set; } = null!;
    public Producto? Producto { get; set; }
    public Combo? Combo { get; set; }
}
