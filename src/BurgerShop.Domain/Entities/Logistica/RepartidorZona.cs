namespace BurgerShop.Domain.Entities.Logistica;

public class RepartidorZona
{
    public int RepartidorId { get; set; }
    public int ZonaId { get; set; }

    public Repartidor Repartidor { get; set; } = null!;
    public Zona Zona { get; set; } = null!;
}
