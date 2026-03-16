using BurgerShop.Domain.Entities.Logistica;
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

        // Buscar si hay un reparto activo (EnCurso) en esta zona hoy
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId
                && r.Fecha == hoy
                && r.Estado == EstadoReparto.EnCurso);

        if (reparto != null)
            return reparto.RepartidorId;

        return null;
    }

    // --- RepartoZona ---

    public async Task<RepartoZona> CrearRepartoZonaAsync(int zonaId, int repartidorId, int totalPedidos)
    {
        var hoy = DateTime.Today;

        // Si ya existe un reparto para esta zona hoy, actualizarlo
        var existente = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy);

        if (existente != null)
        {
            existente.RepartidorId = repartidorId;
            existente.Estado = EstadoReparto.EnCurso;
            existente.FechaInicio = DateTime.Now;
            existente.FechaFinalizacion = null;
            existente.TotalPedidos = totalPedidos;
            existente.TotalEntregados = 0;
            existente.TotalNoEntregados = 0;
            existente.TotalCancelados = 0;
            await _context.SaveChangesAsync();
            return existente;
        }

        var reparto = new RepartoZona
        {
            ZonaId = zonaId,
            RepartidorId = repartidorId,
            Fecha = hoy,
            FechaInicio = DateTime.Now,
            Estado = EstadoReparto.EnCurso,
            TotalPedidos = totalPedidos
        };

        _context.RepartosZona.Add(reparto);
        await _context.SaveChangesAsync();
        return reparto;
    }

    public async Task FinalizarRepartoZonaAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy);

        if (reparto != null)
        {
            reparto.Estado = EstadoReparto.Finalizado;
            reparto.FechaFinalizacion = DateTime.Now;

            // Sincronizar contadores con datos reales de pedidos
            var pedidosZona = await _dbSet
                .Where(p => p.ZonaId == zonaId
                    && p.RepartidorId != null
                    && p.FechaCreacion.Date == hoy)
                .ToListAsync();

            reparto.TotalPedidos = pedidosZona.Count;
            reparto.TotalEntregados = pedidosZona.Count(p => p.Estado == EstadoPedido.Entregado);
            reparto.TotalNoEntregados = pedidosZona.Count(p => p.Estado == EstadoPedido.NoEntregado);
            reparto.TotalCancelados = pedidosZona.Count(p => p.Estado == EstadoPedido.Cancelado);

            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<int>> GetZonasRepartoFinalizadoHoyAsync()
    {
        var hoy = DateTime.Today;
        return await _context.RepartosZona
            .Where(r => r.Fecha == hoy && r.Estado == EstadoReparto.Finalizado)
            .Select(r => r.ZonaId)
            .ToListAsync();
    }

    public async Task<RepartoZona?> GetRepartoZonaActivoHoyAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        return await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId
                && r.Fecha == hoy
                && r.Estado == EstadoReparto.EnCurso);
    }

    public async Task IncrementarContadorRepartoAsync(int zonaId, EstadoPedido estadoFinal)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy);

        if (reparto == null) return;

        switch (estadoFinal)
        {
            case EstadoPedido.Entregado:
                reparto.TotalEntregados++;
                break;
            case EstadoPedido.NoEntregado:
                reparto.TotalNoEntregados++;
                break;
            case EstadoPedido.Cancelado:
                reparto.TotalCancelados++;
                break;
        }

        await _context.SaveChangesAsync();
    }

    public async Task IncrementarTotalPedidosRepartoAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy);

        if (reparto != null)
        {
            reparto.TotalPedidos++;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<RepartoZona>> GetRepartosZonaByRepartidorHoyAsync(int repartidorId)
    {
        var hoy = DateTime.Today;
        return await _context.RepartosZona
            .Include(r => r.Zona)
            .Where(r => r.RepartidorId == repartidorId && r.Fecha == hoy)
            .ToListAsync();
    }

    public async Task<List<RepartoZona>> GetRepartosZonaByRepartidorFechaAsync(int repartidorId, DateTime fecha)
    {
        return await _context.RepartosZona
            .Include(r => r.Zona)
            .Where(r => r.RepartidorId == repartidorId && r.Fecha == fecha.Date)
            .ToListAsync();
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
