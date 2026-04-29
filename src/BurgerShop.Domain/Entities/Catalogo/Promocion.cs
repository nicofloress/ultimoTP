using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Catalogo;

public class Promocion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaDesde { get; set; }
    public DateTime FechaHasta { get; set; }
    public TipoBeneficio TipoBeneficio { get; set; }
    public decimal ValorBeneficio { get; set; }
    public decimal? TopeMaximo { get; set; }
    public bool Acumulable { get; set; } = true;
    public int Prioridad { get; set; } = 0;
    public bool Activa { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public ICollection<PromocionItem> Items { get; set; } = new List<PromocionItem>();
    public ICollection<PromocionLocal> Locales { get; set; } = new List<PromocionLocal>();
    public ICollection<PromocionTipoVenta> TiposVenta { get; set; } = new List<PromocionTipoVenta>();
    public ICollection<PromocionCondicion> Condiciones { get; set; } = new List<PromocionCondicion>();
}
