using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Catalogo;

public class PromocionTipoVenta
{
    public int PromocionId { get; set; }
    public TipoVenta TipoVenta { get; set; }

    public Promocion Promocion { get; set; } = null!;
}
