using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Ventas;

public class PedidoRepository : Repository<Pedido>, IPedidoRepository
{
    public PedidoRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Pedido?> GetByIdWithLineasAsync(int id)
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.Cliente)
            .Include(p => p.Zona)
            .Include(p => p.Repartidor)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Pedido>> GetByFechaAsync(DateTime fecha)
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Where(p => p.FechaCreacion.Date == fecha.Date)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetByEstadoAsync(EstadoPedido estado)
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Where(p => p.Estado == estado)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetByRepartidorHoyAsync(int repartidorId)
    {
        var hoy = DateTime.Today;
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.Zona)
            .Where(p => p.RepartidorId == repartidorId && p.FechaCreacion.Date == hoy)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetPendientesEntregaAsync()
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.Zona)
            .Where(p => p.Tipo == TipoPedido.Domicilio
                && p.Estado == EstadoPedido.Listo
                && p.RepartidorId == null)
            .OrderBy(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<int> GetSiguienteNumeroTicketAsync(DateTime fecha)
    {
        var prefix = $"T-{fecha:yyyyMMdd}-";
        var ultimoTicket = await _dbSet
            .Where(p => p.NumeroTicket.StartsWith(prefix))
            .OrderByDescending(p => p.NumeroTicket)
            .Select(p => p.NumeroTicket)
            .FirstOrDefaultAsync();

        if (ultimoTicket == null) return 1;

        var numero = int.Parse(ultimoTicket.Split('-').Last());
        return numero + 1;
    }
}
