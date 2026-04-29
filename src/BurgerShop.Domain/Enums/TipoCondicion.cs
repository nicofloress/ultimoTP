namespace BurgerShop.Domain.Enums;

public enum TipoCondicion
{
    DiaSemana = 1,        // Valor: JSON array de ints 0-6 (0=Domingo)
    FormaPago = 2,        // Valor: JSON array de FormaPago.Id
    MontoMinimo = 3,      // Valor: decimal
    Horario = 4,          // Valor: { "desde": "HH:mm", "hasta": "HH:mm" }
    TipoCliente = 6,      // Valor: JSON array de TipoCliente.Id  (sin evaluator todavia)
    Cupon = 8,            // Valor: string (código)               (sin evaluator todavia)
    CantidadMinima = 9    // Valor: int
}
