namespace BurgerShop.Domain.Entities.Ventas;

public class PagoPedido
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public int FormaPagoId { get; set; }
    public decimal Monto { get; set; }
    public decimal PorcentajeRecargo { get; set; }
    public decimal Recargo { get; set; }
    public decimal TotalACobrar { get; set; }
    public Pedido Pedido { get; set; } = null!;
    public FormaPago FormaPago { get; set; } = null!;
}
