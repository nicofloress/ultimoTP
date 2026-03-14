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
            .Include(p => p.FormaPago)
            .Include(p => p.Repartidor)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Pedido>> GetByFechaAsync(DateTime fecha)
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.FormaPago)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(p => p.FechaCreacion.Date == fecha.Date
                || (p.FechaProgramada != null && p.FechaProgramada.Value.Date == fecha.Date))
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetByEstadoAsync(EstadoPedido estado)
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.FormaPago)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
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
            .Include(p => p.FormaPago)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(p => p.RepartidorId == repartidorId && p.FechaCreacion.Date == hoy)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetPendientesEntregaAsync()
    {
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.Zona)
            .Include(p => p.FormaPago)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(p => p.Tipo == TipoPedido.Domicilio
                && p.Estado == EstadoPedido.Pendiente
                && p.RepartidorId == null)
            .OrderBy(p => p.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetListosParaRepartoConProductosAsync()
    {
        var hoy = DateTime.Today;
        return await _dbSet
            .Include(p => p.Lineas).ThenInclude(l => l.Producto).ThenInclude(pr => pr!.Categoria)
            .Include(p => p.Lineas).ThenInclude(l => l.Combo).ThenInclude(c => c!.Detalles).ThenInclude(d => d.Producto).ThenInclude(pr => pr.Categoria)
            .Include(p => p.Zona)
            .Include(p => p.Repartidor)
            .Where(p => p.Tipo == TipoPedido.Domicilio
                && p.Estado == EstadoPedido.Pendiente
                && p.ZonaId != null
                && (p.FechaProgramada == null
                    ? p.FechaCreacion.Date == hoy
                    : p.FechaProgramada.Value.Date <= hoy))
            .ToListAsync();
    }

    public async Task<IEnumerable<Pedido>> GetListosParaRepartoHoyAsync()
    {
        var hoy = DateTime.Today;
        var estadosReparto = new[]
        {
            EstadoPedido.Pendiente,
            EstadoPedido.Asignado, EstadoPedido.EnCamino,
            EstadoPedido.Entregado, EstadoPedido.Cancelado,
            EstadoPedido.NoEntregado
        };
        return await _dbSet
            .Include(p => p.Lineas)
            .Include(p => p.Zona)
            .Include(p => p.FormaPago)
            .Include(p => p.Repartidor)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(p => p.Tipo == TipoPedido.Domicilio
                && estadosReparto.Contains(p.Estado)
                && p.ZonaId != null
                && (p.FechaProgramada == null
                    ? p.FechaCreacion.Date == hoy
                    : p.FechaProgramada.Value.Date <= hoy))
            .OrderBy(p => p.ZonaId)
            .ThenBy(p => p.FechaCreacion)
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

    public async Task<int?> GetRepartidorActivoEnZonaHoyAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        var manana = hoy.AddDays(1);

        // Buscar pedidos de hoy en esa zona con repartidor asignado
        var pedidosZonaHoy = await _dbSet
            .Where(p => p.ZonaId == zonaId
                && p.RepartidorId != null
                && p.FechaAsignacion != null
                && p.FechaAsignacion >= hoy
                && p.FechaAsignacion < manana)
            .Select(p => new { p.RepartidorId, p.Estado })
            .ToListAsync();

        if (!pedidosZonaHoy.Any()) return null;

        // Solo auto-asignar si hay al menos un pedido activo (no todos finalizados)
        var hayActivos = pedidosZonaHoy.Any(p =>
            p.Estado == EstadoPedido.Pendiente
            || p.Estado == EstadoPedido.Asignado
            || p.Estado == EstadoPedido.EnCamino);

        if (!hayActivos) return null;

        return pedidosZonaHoy.First().RepartidorId;
    }

    public async Task<IEnumerable<Pedido>> GetByCierreCajaAsync(int cierreCajaId)
    {
        return await _dbSet
            .Include(p => p.FormaPago)
            .Include(p => p.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(p => p.CierreCajaId == cierreCajaId && p.Estado != EstadoPedido.Cancelado && p.Estado != EstadoPedido.NoEntregado)
            .ToListAsync();
    }
}
