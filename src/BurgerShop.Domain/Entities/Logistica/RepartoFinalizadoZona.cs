using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Logistica;

public class RepartoZona
{
    public int Id { get; set; }
    public int ZonaId { get; set; }
    public int RepartidorId { get; set; }
    public DateTime Fecha { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFinalizacion { get; set; }
    public EstadoReparto Estado { get; set; } = EstadoReparto.EnCurso;

    // Contadores denormalizados
    public int TotalPedidos { get; set; }
    public int TotalEntregados { get; set; }
    public int TotalNoEntregados { get; set; }
    public int TotalCancelados { get; set; }

    // Navegación
    public Zona Zona { get; set; } = null!;
    public Repartidor Repartidor { get; set; } = null!;
}
