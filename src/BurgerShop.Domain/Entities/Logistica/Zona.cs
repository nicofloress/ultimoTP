namespace BurgerShop.Domain.Entities.Logistica;

public class Zona
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal CostoEnvio { get; set; }
    public bool Activa { get; set; } = true;

    public ICollection<RepartidorZona> RepartidorZonas { get; set; } = new List<RepartidorZona>();
}
