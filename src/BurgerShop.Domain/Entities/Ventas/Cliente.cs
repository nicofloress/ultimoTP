using BurgerShop.Domain.Entities.Logistica;

namespace BurgerShop.Domain.Entities.Ventas;

public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public int? ZonaId { get; set; }

    public Zona? Zona { get; set; }
    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
