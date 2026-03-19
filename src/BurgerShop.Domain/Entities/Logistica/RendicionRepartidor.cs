namespace BurgerShop.Domain.Entities.Logistica;

public class RendicionRepartidor
{
    public int Id { get; set; }
    public int RepartidorId { get; set; }
    public Repartidor Repartidor { get; set; } = null!;
    public DateTime Fecha { get; set; }

    // Totales calculados
    public decimal TotalEfectivo { get; set; }
    public decimal TotalTransferencia { get; set; }
    public decimal TotalNoEntregado { get; set; }
    public int CantidadEntregados { get; set; }
    public int CantidadNoEntregados { get; set; }

    // Lo que dice el repartidor que tiene en mano
    public decimal EfectivoDeclarado { get; set; }
    public decimal Diferencia { get; set; } // EfectivoDeclarado - TotalEfectivo

    public int? RepartoZonaId { get; set; }
    public RepartoZona? RepartoZona { get; set; }

    public string? Observaciones { get; set; }
    public bool Aprobada { get; set; }
    public DateTime? FechaAprobacion { get; set; }

    public List<RendicionDetalle> Detalles { get; set; } = new();
}
