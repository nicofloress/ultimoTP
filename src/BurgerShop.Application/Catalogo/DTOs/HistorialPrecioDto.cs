namespace BurgerShop.Application.Catalogo.DTOs;

public record HistorialPrecioDto(
    int Id,
    string TipoEntidad,
    int EntidadId,
    string? NombreEntidad,
    decimal PrecioAnterior,
    decimal PrecioNuevo,
    DateTime FechaCambio,
    string? UsuarioNombre);
