using BurgerShop.Domain.Entities.Sistema;
using BurgerShop.Domain.Enums;

namespace BurgerShop.Domain.Interfaces.Sistema;

public interface ILogEntryRepository : IRepository<LogEntry>
{
    Task<(IEnumerable<LogEntry> Items, int TotalCount)> GetPaginatedAsync(
        DateTime? desde,
        DateTime? hasta,
        LogNivel? nivel,
        string? busqueda,
        int page,
        int pageSize);

    /// <summary>Elimina logs más antiguos que <paramref name="diasAntigüedad"/> días. Devuelve la cantidad de registros borrados.</summary>
    Task<int> LimpiarAntiguosAsync(int diasAntigüedad);
}
