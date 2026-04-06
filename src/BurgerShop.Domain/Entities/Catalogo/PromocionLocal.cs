using BurgerShop.Domain.Entities.Inventario;

namespace BurgerShop.Domain.Entities.Catalogo;

public class PromocionLocal
{
    public int PromocionId { get; set; }
    public int LocalId { get; set; }

    public Promocion Promocion { get; set; } = null!;
    public Local Local { get; set; } = null!;
}
