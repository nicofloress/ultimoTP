namespace BurgerShop.Domain.Entities.Ventas;

public class CuentaCorriente
{
    public int      Id                     { get; set; }
    public int      ClienteId              { get; set; }
    public decimal  SaldoActual            { get; set; }          // Positivo = debe, Negativo = a favor
    public decimal  LimiteCredito          { get; set; }          // 0 = sin límite
    public bool     Activa                 { get; set; } = true;
    public DateTime FechaApertura          { get; set; } = DateTime.Now;
    public DateTime FechaUltimoMovimiento  { get; set; }

    // Navigation
    public Cliente                                 Cliente      { get; set; } = null!;
    public ICollection<MovimientoCuentaCorriente>  Movimientos  { get; set; } = new List<MovimientoCuentaCorriente>();
}
