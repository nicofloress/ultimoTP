namespace BurgerShop.Domain.Entities.Catalogo;

public class Combo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public bool Activo { get; set; } = true;
    public int? CategoriaId { get; set; }

    public Categoria? Categoria { get; set; }
    public ICollection<ComboDetalle> Detalles { get; set; } = new List<ComboDetalle>();
}
