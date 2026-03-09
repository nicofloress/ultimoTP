namespace BurgerShop.Domain.Entities.Ventas;

public class FormaPago
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal PorcentajeRecargo { get; set; }
    public bool Activa { get; set; } = true;
}
