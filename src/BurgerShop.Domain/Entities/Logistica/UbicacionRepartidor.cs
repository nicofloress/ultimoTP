namespace BurgerShop.Domain.Entities.Logistica;

public class UbicacionRepartidor
{
    public int Id { get; set; }
    public int RepartidorId { get; set; }
    public double Latitud { get; set; }
    public double Longitud { get; set; }
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
    public bool EstaActivo { get; set; } = true;
    public Repartidor Repartidor { get; set; } = null!;
}
