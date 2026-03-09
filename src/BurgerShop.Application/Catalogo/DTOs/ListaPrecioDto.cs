namespace BurgerShop.Application.Catalogo.DTOs;

public record ListaPrecioDto(int Id, string Nombre, bool EsDefault, bool Activa, List<ListaPrecioDetalleDto> Detalles);

public record ListaPrecioDetalleDto(int Id, int ProductoId, string ProductoNombre, decimal Precio);

public record CrearListaPrecioDto(string Nombre, bool EsDefault);

public record ActualizarListaPrecioDto(string Nombre, bool EsDefault, bool Activa);

public record UpsertDetalleDto(int ProductoId, decimal Precio);
