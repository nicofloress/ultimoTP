using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Catalogo;

public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activa { get; set; } = true;
    public SeccionCamioneta SeccionCamioneta { get; set; } = SeccionCamioneta.Ninguno;

    // Jerarquía: categoría padre (null = categoría raíz)
    public int? CategoriaPadreId { get; set; }
    public Categoria? CategoriaPadre { get; set; }
    public ICollection<Categoria> SubCategorias { get; set; } = new List<Categoria>();

    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
