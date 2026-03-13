namespace BurgerShop.Domain.Entities.Catalogo;

public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int CategoriaId { get; set; }
    public bool Activo { get; set; } = true;
    public string? ImagenUrl { get; set; }
    public string? NumeroInterno { get; set; }
    public int? PesoGramos { get; set; }
    public int UnidadesPorBulto { get; set; } = 1;
    public string? Marca { get; set; }
    public int UnidadesPorMedia { get; set; } = 0;

    public Categoria Categoria { get; set; } = null!;
    public ICollection<ComboDetalle> ComboDetalles { get; set; } = new List<ComboDetalle>();
}
