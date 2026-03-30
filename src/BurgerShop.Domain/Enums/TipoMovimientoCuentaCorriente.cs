namespace BurgerShop.Domain.Enums;

public enum TipoMovimientoCuentaCorriente
{
    Cargo        = 1, // Venta a crédito (aumenta deuda)
    Pago         = 2, // Pago del cliente (reduce deuda)
    AjusteManual = 3  // Corrección contable
}
