namespace BurgerShop.Domain.Entities.Catalogo;

public class ListaPrecio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsDefault { get; set; }
    public bool Activa { get; set; } = true;
    public ICollection<ListaPrecioDetalle> Detalles { get; set; } = new List<ListaPrecioDetalle>();
}
