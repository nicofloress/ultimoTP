using BurgerShop.Domain.Entities.Sistema;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces.Sistema;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Sistema;

public class LogEntryRepository : Repository<LogEntry>, ILogEntryRepository
{
    public LogEntryRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<(IEnumerable<LogEntry> Items, int TotalCount)> GetPaginatedAsync(
        DateTime? desde,
        DateTime? hasta,
        LogNivel? nivel,
        string? busqueda,
        int page,
        int pageSize)
    {
        var query = _dbSet.AsQueryable();

        if (desde.HasValue)
            query = query.Where(l => l.Fecha >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(l => l.Fecha <= hasta.Value);

        if (nivel.HasValue)
            query = query.Where(l => l.Nivel == nivel.Value);

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var termino = busqueda.ToLower();
            query = query.Where(l =>
                l.Origen.ToLower().Contains(termino) ||
                l.Mensaje.ToLower().Contains(termino) ||
                (l.UsuarioNombre != null && l.UsuarioNombre.ToLower().Contains(termino)) ||
                (l.Ruta != null && l.Ruta.ToLower().Contains(termino)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<int> LimpiarAntiguosAsync(int diasAntigüedad)
    {
        var fechaLimite = DateTime.Now.AddDays(-diasAntigüedad);
        var antiguos = await _dbSet
            .Where(l => l.Fecha < fechaLimite)
            .ToListAsync();

        if (antiguos.Count == 0)
            return 0;

        _dbSet.RemoveRange(antiguos);
        await _context.SaveChangesAsync();
        return antiguos.Count;
    }
}
