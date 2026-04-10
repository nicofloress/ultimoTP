namespace BurgerShop.Domain.Entities.Catalogo;

public class Marca
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? ProveedorId { get; set; }
    public bool Activo { get; set; } = true;

    public Proveedor? Proveedor { get; set; }
}
