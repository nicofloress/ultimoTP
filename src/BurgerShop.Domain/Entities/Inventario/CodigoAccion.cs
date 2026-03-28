using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Inventario;

public class CodigoAccion
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty; // EGR_VTA, ING_VTA, etc
    public string Nombre { get; set; } = string.Empty;
    public int Signo { get; set; } // +1 o -1
    public TipoAfectacion TipoAfectacion { get; set; }
    public bool Activo { get; set; } = true;
}
