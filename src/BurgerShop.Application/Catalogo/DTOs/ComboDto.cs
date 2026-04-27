namespace BurgerShop.Application.Catalogo.DTOs;

public record ComboDto(int Id, string Nombre, string? Descripcion, decimal Precio, bool Activo, List<ComboDetalleDto> Detalles, bool EsOfertaSemanal = false, string? Codigo = null);
public record ComboDetalleDto(int ProductoId, string ProductoNombre, int Cantidad, decimal PrecioProducto);
public record CrearComboDto(string Nombre, string? Descripcion, decimal Precio, List<CrearComboDetalleDto> Detalles, bool EsOfertaSemanal = false, string? Codigo = null);
public record CrearComboDetalleDto(int ProductoId, int Cantidad);
public record ActualizarComboDto(string Nombre, string? Descripcion, decimal Precio, bool Activo, List<CrearComboDetalleDto> Detalles, bool EsOfertaSemanal = false, string? Codigo = null);
