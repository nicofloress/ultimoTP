namespace BurgerShop.Domain.Entities.Catalogo;

public class ComboDetalle
{
    public int ComboId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; } = 1;

    public Combo Combo { get; set; } = null!;
    public Producto Producto { get; set; } = null!;
}
