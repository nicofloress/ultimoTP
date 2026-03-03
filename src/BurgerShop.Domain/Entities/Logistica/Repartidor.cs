using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Entities.Logistica;

public class Repartidor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Vehiculo { get; set; }
    public bool Activo { get; set; } = true;
    public string CodigoAcceso { get; set; } = string.Empty;

    public ICollection<RepartidorZona> RepartidorZonas { get; set; } = new List<RepartidorZona>();
    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
