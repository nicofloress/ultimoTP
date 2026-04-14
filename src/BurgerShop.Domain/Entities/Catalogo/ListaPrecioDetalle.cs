namespace BurgerShop.Domain.Entities.Catalogo;

public class ListaPrecioDetalle
{
    public int Id { get; set; }
    public int ListaPrecioId { get; set; }
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public decimal Precio { get; set; }
    public ListaPrecio ListaPrecio { get; set; } = null!;
    public Producto? Producto { get; set; }
    public Combo? Combo { get; set; }
}
