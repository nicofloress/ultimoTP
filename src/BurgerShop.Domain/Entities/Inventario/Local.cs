namespace BurgerShop.Domain.Entities.Inventario;

public class Local
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public bool EsPuntoVenta { get; set; } = true;
    public bool Activo { get; set; } = true;
}
