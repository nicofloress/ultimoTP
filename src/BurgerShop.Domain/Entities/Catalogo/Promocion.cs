using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Catalogo;

public class Promocion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaDesde { get; set; }
    public DateTime FechaHasta { get; set; }
    public TipoDescuento TipoDescuento { get; set; }
    public decimal ValorDescuento { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public ICollection<PromocionItem> Items { get; set; } = new List<PromocionItem>();
    public ICollection<PromocionLocal> Locales { get; set; } = new List<PromocionLocal>();
}
