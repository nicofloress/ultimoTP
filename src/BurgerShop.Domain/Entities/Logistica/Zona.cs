using BurgerShop.Domain.Entities.Inventario;

namespace BurgerShop.Domain.Entities.Logistica;

public class Zona
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal CostoEnvio { get; set; }
    public bool Activa { get; set; } = true;
    public int? LocalId { get; set; }

    public Local? Local { get; set; }
    public ICollection<RepartidorZona> RepartidorZonas { get; set; } = new List<RepartidorZona>();
}
