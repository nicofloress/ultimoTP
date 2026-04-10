using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Finanzas;

public class CierreCaja
{
    public int Id { get; set; }
    public DateTime FechaApertura { get; set; }
    public DateTime? FechaCierre { get; set; }
    public decimal MontoInicial { get; set; }
    public decimal? MontoFinal { get; set; }
    public EstadoCaja Estado { get; set; } = EstadoCaja.Abierta;
    public string? Observaciones { get; set; }
    public int? UsuarioId { get; set; }
    public int? LocalId { get; set; }
    public Local? Local { get; set; }
    public int CantidadDomicilio { get; set; }
    public decimal TotalDomicilio { get; set; }
    public int CantidadMostrador { get; set; }
    public decimal TotalMostrador { get; set; }
    public int CantidadCtaCte { get; set; }
    public decimal TotalCtaCte { get; set; }
    public ICollection<CierreCajaDetalle> Detalles { get; set; } = new List<CierreCajaDetalle>();
    public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
}
