using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class HistorialPrecioService : IHistorialPrecioService
{
    private readonly IHistorialPrecioRepository _repo;

    public HistorialPrecioService(IHistorialPrecioRepository repo) => _repo = repo;

    public async Task RegistrarCambioAsync(string tipoEntidad, int entidadId, string? nombreEntidad, decimal precioAnterior, decimal precioNuevo, string? usuarioNombre = null)
    {
        if (precioAnterior == precioNuevo) return;

        var historial = new HistorialPrecio
        {
            TipoEntidad = tipoEntidad,
            EntidadId = entidadId,
            NombreEntidad = nombreEntidad,
            PrecioAnterior = precioAnterior,
            PrecioNuevo = precioNuevo,
            FechaCambio = DateTime.UtcNow,
            UsuarioNombre = usuarioNombre
        };
        await _repo.AddAsync(historial);
        await _repo.SaveChangesAsync();
    }

    public async Task<IEnumerable<HistorialPrecioDto>> GetByEntidadAsync(string tipoEntidad, int entidadId)
    {
        var items = await _repo.GetByEntidadAsync(tipoEntidad, entidadId);
        return items.Select(ToDto);
    }

    public async Task<IEnumerable<HistorialPrecioDto>> GetRecientesAsync(int cantidad = 50)
    {
        var items = await _repo.GetRecientesAsync(cantidad);
        return items.Select(ToDto);
    }

    private static HistorialPrecioDto ToDto(HistorialPrecio h) => new(
        h.Id, h.TipoEntidad, h.EntidadId, h.NombreEntidad,
        h.PrecioAnterior, h.PrecioNuevo, h.FechaCambio, h.UsuarioNombre);
}
