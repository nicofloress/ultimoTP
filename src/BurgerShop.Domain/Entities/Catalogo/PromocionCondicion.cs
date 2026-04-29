using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Catalogo;

public class PromocionCondicion
{
    public int Id { get; set; }
    public int PromocionId { get; set; }
    public TipoCondicion Tipo { get; set; }
    public string Valor { get; set; } = string.Empty;

    public Promocion Promocion { get; set; } = null!;
}
