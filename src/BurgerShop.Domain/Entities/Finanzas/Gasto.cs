using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Entities.Finanzas;

public class Gasto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaGasto { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public string? Categoria { get; set; }
    public string? Proveedor { get; set; }
    public string? Etiqueta { get; set; }
    public int? FormaPagoId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }
    public decimal Deuda { get; set; }
    public bool Pagado { get; set; }
    public string? Observaciones { get; set; }
    public int? LocalId { get; set; }
    public int? UsuarioId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public bool Activo { get; set; } = true;

    public FormaPago? FormaPago { get; set; }
    public Local? Local { get; set; }
}
