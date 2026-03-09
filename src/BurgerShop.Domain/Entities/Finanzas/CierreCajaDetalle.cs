using BurgerShop.Domain.Entities.Ventas;

namespace BurgerShop.Domain.Entities.Finanzas;

public class CierreCajaDetalle
{
    public int Id { get; set; }
    public int CierreCajaId { get; set; }
    public int FormaPagoId { get; set; }
    public decimal MontoTotal { get; set; }
    public int CantidadOperaciones { get; set; }
    public CierreCaja CierreCaja { get; set; } = null!;
    public FormaPago FormaPago { get; set; } = null!;
}
