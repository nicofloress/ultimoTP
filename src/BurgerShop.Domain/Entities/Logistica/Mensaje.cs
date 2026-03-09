namespace BurgerShop.Domain.Entities.Logistica;

public class Mensaje
{
    public int Id { get; set; }
    public int RepartidorId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public bool EsDeAdmin { get; set; }
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public bool Leido { get; set; } = false;
    public Repartidor Repartidor { get; set; } = null!;
}
