using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Logistica;

public class MensajeRepository : Repository<Mensaje>, IMensajeRepository
{
    public MensajeRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<IEnumerable<Mensaje>> GetByRepartidorAsync(int repartidorId)
    {
        return await _dbSet
            .Where(m => m.RepartidorId == repartidorId)
            .OrderBy(m => m.FechaEnvio)
            .ToListAsync();
    }

    public async Task<int> MarcarLeidosAsync(int repartidorId, bool esDeAdmin)
    {
        // Marca como leídos los mensajes enviados por el otro lado
        // Si esDeAdmin=true (admin está leyendo), marca como leídos los del repartidor (EsDeAdmin=false)
        // Si esDeAdmin=false (repartidor está leyendo), marca como leídos los del admin (EsDeAdmin=true)
        var mensajes = await _dbSet
            .Where(m => m.RepartidorId == repartidorId && m.EsDeAdmin != esDeAdmin && !m.Leido)
            .ToListAsync();

        foreach (var m in mensajes)
        {
            m.Leido = true;
        }

        return await _context.SaveChangesAsync();
    }

    public async Task<int> GetNoLeidosCountAsync(int repartidorId, bool esDeAdmin)
    {
        // Cuenta mensajes no leídos enviados por el otro lado
        return await _dbSet
            .CountAsync(m => m.RepartidorId == repartidorId && m.EsDeAdmin != esDeAdmin && !m.Leido);
    }

    public async Task<IReadOnlyList<(int RepartidorId, int Count)>> GetNoLeidosBulkAsync(int? localId, bool esDeAdmin)
    {
        // Cuenta no leídos por repartidor en una sola query, opcionalmente filtrado por local
        var query = _dbSet
            .Where(m => m.EsDeAdmin != esDeAdmin && !m.Leido);

        if (localId.HasValue)
        {
            query = query.Where(m => m.Repartidor.LocalId == localId.Value);
        }

        var result = await query
            .GroupBy(m => m.RepartidorId)
            .Select(g => new { RepartidorId = g.Key, Count = g.Count() })
            .ToListAsync();

        return result.Select(x => (x.RepartidorId, x.Count)).ToList();
    }
}
