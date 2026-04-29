using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Ventas;

public class VentaPromocion
{
    public int Id { get; set; }
    public int VentaId { get; set; }
    public int PromocionId { get; set; }

    // Snapshots al momento de aplicar (para auditoria contable)
    public string NombrePromocion { get; set; } = string.Empty;
    public TipoBeneficio TipoBeneficio { get; set; }

    public decimal MontoDescuento { get; set; }
    public decimal MontoReintegro { get; set; }
    public bool EsReintegro { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public Venta Venta { get; set; } = null!;
    public Promocion? Promocion { get; set; }
}
