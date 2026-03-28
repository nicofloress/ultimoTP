using BurgerShop.Domain.Entities.Catalogo;

namespace BurgerShop.Domain.Entities.Inventario;

public class ArtiStock
{
    public int ProductoId { get; set; }
    public int LocalId { get; set; }
    public decimal IngresoLocal { get; set; }  // Total unidades ingresadas
    public decimal EgresoLocal { get; set; }   // Total unidades egresadas (merma, ajuste, etc)
    public decimal VentaLocal { get; set; }    // Total unidades vendidas
    public decimal StockFinal { get; set; }    // = IngresoLocal - EgresoLocal - VentaLocal
    public decimal? StockMinimo { get; set; }
    public DateTime UltimaModificacion { get; set; }
    public bool EsPuntoVenta { get; set; }

    // Navigation
    public Producto Producto { get; set; } = null!;
    public Local Local { get; set; } = null!;
}
