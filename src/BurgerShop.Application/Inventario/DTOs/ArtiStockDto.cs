namespace BurgerShop.Application.Inventario.DTOs;

public record ArtiStockDto(
    int ProductoId, string ProductoNombre,
    int LocalId, string LocalNombre,
    decimal IngresoLocal, decimal EgresoLocal, decimal VentaLocal,
    decimal StockFinal, decimal? StockMinimo,
    DateTime UltimaModificacion, bool EsPuntoVenta);

public record ActualizarStockMinimoDto(int ProductoId, int LocalId, decimal StockMinimo);
