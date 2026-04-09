using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Entities.Ventas;

public class MovimientoCuentaCorriente
{
    public int      Id                 { get; set; }
    public int      CuentaCorrienteId  { get; set; }
    public DateTime FechaMovimiento    { get; set; }
    public DateTime FechaProceso       { get; set; }
    public TipoMovimientoCuentaCorriente Tipo { get; set; }
    public decimal  Monto              { get; set; }  // Siempre positivo
    public decimal  SaldoResultante    { get; set; }  // Saldo DESPUÉS de este movimiento
    public int?     VentaId            { get; set; }  // Si viene de una venta (mostrador o domicilio)
    public int?     MovimientoId       { get; set; }  // FK a Movimientos (pagos que afectan caja)
    public int?     UsuarioId          { get; set; }
    public string?  Observaciones      { get; set; }

    // Navigation
    public CuentaCorriente  CuentaCorriente { get; set; } = null!;
    public Venta?           Venta           { get; set; }
    public Movimiento?      Movimiento      { get; set; }
    public Usuario?         Usuario         { get; set; }
}
