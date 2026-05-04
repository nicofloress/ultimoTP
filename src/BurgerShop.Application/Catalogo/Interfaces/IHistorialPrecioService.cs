using BurgerShop.Application.Catalogo.DTOs;

namespace BurgerShop.Application.Catalogo.Interfaces;

public interface IHistorialPrecioService
{
    Task RegistrarCambioAsync(string tipoEntidad, int entidadId, string? nombreEntidad, decimal precioAnterior, decimal precioNuevo, string? usuarioNombre = null);
    Task<IEnumerable<HistorialPrecioDto>> GetByEntidadAsync(string tipoEntidad, int entidadId);
    Task<IEnumerable<HistorialPrecioDto>> GetRecientesAsync(int cantidad = 50);
}
