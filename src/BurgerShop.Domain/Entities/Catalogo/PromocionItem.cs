namespace BurgerShop.Domain.Entities.Catalogo;

public class PromocionItem
{
    public int Id { get; set; }
    public int PromocionId { get; set; }
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public decimal? PrecioPromo { get; set; }

    public Promocion Promocion { get; set; } = null!;
    public Producto? Producto { get; set; }
    public Combo? Combo { get; set; }
}
