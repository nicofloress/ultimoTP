namespace BurgerShop.Application.Catalogo.Promociones;

public record EvaluacionContexto(
    DateTime Fecha,
    int? FormaPagoId,
    int TipoVenta,
    int LocalId,
    int? ClienteId,
    decimal Subtotal,
    int CantidadTotalItems,
    IReadOnlyList<EvaluacionItem> Items
);

public record EvaluacionItem(
    int? ProductoId,
    int? ComboId,
    int? CategoriaId,
    int Cantidad,
    decimal PrecioUnitario
);
