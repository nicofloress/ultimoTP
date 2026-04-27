using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Repositories.Ventas;

public class VentaRepository : Repository<Venta>, IVentaRepository
{
    public VentaRepository(BurgerShopDbContext context) : base(context) { }

    public async Task<Venta?> GetByIdWithLineasAsync(int id)
    {
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Cliente)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.FormaPago)
            .Include(v => v.Repartidor)
            .Include(v => v.Usuario)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Venta?> GetByIdConDetallesAsync(int id)
    {
        return await GetByIdWithLineasAsync(id);
    }

    public async Task<IEnumerable<Venta>> GetByFechaAsync(DateTime fecha)
    {
        var repartosEnCursoIds = await _context.RepartosZona
            .Where(r => r.Fecha == fecha.Date && r.Estado == EstadoReparto.EnCurso)
            .Select(r => r.Id)
            .ToListAsync();

        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.Repartidor)
            .Include(v => v.FormaPago)
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.FechaCreacion.Date == fecha.Date
                || (v.FechaProgramada != null && v.FechaProgramada.Value.Date == fecha.Date)
                || (v.RepartoZonaId != null && repartosEnCursoIds.Contains(v.RepartoZonaId.Value)))
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByRangoFechasAsync(DateTime desde, DateTime hasta)
    {
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.Repartidor)
            .Include(v => v.FormaPago)
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.FechaCreacion.Date >= desde.Date && v.FechaCreacion.Date <= hasta.Date)
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByEstadoAsync(EstadoVenta estado)
    {
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.FormaPago)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.Estado == estado)
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByRepartidorHoyAsync(int repartidorId)
    {
        var hoy = DateTime.Today;
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.FormaPago)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.RepartidorId == repartidorId
                && (v.FechaProgramada == null
                    ? v.FechaCreacion.Date == hoy
                    : v.FechaProgramada.Value.Date == hoy))
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetPendientesEntregaAsync()
    {
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.FormaPago)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.Tipo == TipoVenta.Domicilio
                && v.Estado == EstadoVenta.Pendiente
                && v.RepartidorId == null)
            .OrderBy(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetListosParaRepartoConProductosAsync()
    {
        var hoy = DateTime.Today;
        return await _dbSet
            .Include(v => v.Lineas).ThenInclude(l => l.Producto).ThenInclude(pr => pr!.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Lineas).ThenInclude(l => l.Combo).ThenInclude(c => c!.Detalles).ThenInclude(d => d.Producto).ThenInclude(pr => pr.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.Repartidor)
            .Where(v => v.Tipo == TipoVenta.Domicilio
                && v.Estado == EstadoVenta.Pendiente
                && v.ZonaId != null
                && (v.FechaProgramada == null
                    ? v.FechaCreacion.Date == hoy
                    : v.FechaProgramada.Value.Date <= hoy))
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetListosParaRepartoHoyAsync()
    {
        var hoy = DateTime.Today;

        var repartosEnCursoIds = await _context.RepartosZona
            .Where(r => r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso)
            .Select(r => r.Id)
            .ToListAsync();

        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Local)
            .Include(v => v.Zona)
            .Include(v => v.FormaPago)
            .Include(v => v.Repartidor)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.Tipo == TipoVenta.Domicilio
                && v.ZonaId != null
                && (v.FechaProgramada == null
                    ? v.FechaCreacion.Date == hoy
                    : v.FechaProgramada.Value.Date <= hoy)
                && (
                    (v.Estado == EstadoVenta.Pendiente && v.RepartoZonaId == null)
                    || (v.RepartoZonaId != null && repartosEnCursoIds.Contains(v.RepartoZonaId.Value))
                ))
            .OrderBy(v => v.ZonaId)
            .ThenBy(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<int> GetSiguienteNumeroTicketAsync(DateTime fecha)
    {
        var prefix = $"T-{fecha:yyyyMMdd}-";
        var ultimoTicket = await _dbSet
            .Where(v => v.NumeroTicket.StartsWith(prefix))
            .OrderByDescending(v => v.NumeroTicket)
            .Select(v => v.NumeroTicket)
            .FirstOrDefaultAsync();

        if (ultimoTicket == null) return 1;

        var numero = int.Parse(ultimoTicket.Split('-').Last());
        return numero + 1;
    }

    public async Task<int?> GetRepartidorActivoEnZonaHoyAsync(int zonaId)
    {
        var hoy = DateTime.Today;

        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId
                && r.Fecha == hoy
                && r.Estado == EstadoReparto.EnCurso);

        if (reparto != null)
            return reparto.RepartidorId;

        return null;
    }

    // --- RepartoZona ---

    public async Task<RepartoZona> CrearRepartoZonaAsync(int zonaId, int repartidorId, int totalVentas, decimal montoInicialCambio = 0)
    {
        var hoy = DateTime.Today;

        var existente = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso);

        if (existente != null)
        {
            existente.RepartidorId = repartidorId;
            existente.FechaInicio = DateTime.Now;
            existente.TotalVentas = totalVentas;
            existente.TotalEntregados = 0;
            existente.TotalNoEntregados = 0;
            existente.TotalCancelados = 0;
            existente.MontoInicialCambio = montoInicialCambio;
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
            TotalVentas = totalVentas,
            MontoInicialCambio = montoInicialCambio
        };

        _context.RepartosZona.Add(reparto);
        await _context.SaveChangesAsync();
        return reparto;
    }

    public async Task FinalizarRepartoZonaAsync(int zonaId, int repartidorId)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.RepartidorId == repartidorId && r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso);

        if (reparto != null)
        {
            reparto.Estado = EstadoReparto.Finalizado;
            reparto.FechaFinalizacion = DateTime.Now;

            var ventasZona = await _dbSet
                .Where(v => v.RepartoZonaId == reparto.Id)
                .ToListAsync();

            // Desvincular pedidos programados a futuro que quedaron pegados al reparto sin entregar.
            var manana = DateTime.Today.AddDays(1);
            foreach (var venta in ventasZona)
            {
                if ((venta.Estado == EstadoVenta.Asignado || venta.Estado == EstadoVenta.EnCamino)
                    && venta.FechaProgramada.HasValue
                    && venta.FechaProgramada.Value.Date >= manana)
                {
                    venta.RepartoZonaId = null;
                    venta.RepartidorId = null;
                    venta.FechaAsignacion = null;
                    venta.Estado = EstadoVenta.Pendiente;
                }
            }
            ventasZona = ventasZona.Where(v => v.RepartoZonaId == reparto.Id).ToList();

            reparto.TotalVentas = ventasZona.Count;
            reparto.TotalEntregados = ventasZona.Count(v => v.Estado == EstadoVenta.Entregado);
            reparto.TotalNoEntregados = ventasZona.Count(v => v.Estado == EstadoVenta.NoEntregado);
            reparto.TotalCancelados = ventasZona.Count(v => v.Estado == EstadoVenta.Cancelado);

            await _context.SaveChangesAsync();
        }
    }

    public async Task<RepartoZona?> GetRepartoZonaActivoHoyAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        return await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId
                && r.Fecha == hoy
                && r.Estado == EstadoReparto.EnCurso);
    }

    public async Task<RepartoZona?> FinalizarRepartoZonaPorIdAsync(int repartoZonaId)
    {
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.Id == repartoZonaId && r.Estado == EstadoReparto.EnCurso);

        if (reparto == null) return null;

        reparto.Estado = EstadoReparto.Finalizado;
        reparto.FechaFinalizacion = DateTime.Now;

        var ventasZona = await _dbSet
            .Where(v => v.RepartoZonaId == reparto.Id)
            .ToListAsync();

        var manana = DateTime.Today.AddDays(1);
        foreach (var venta in ventasZona)
        {
            if ((venta.Estado == EstadoVenta.Asignado || venta.Estado == EstadoVenta.EnCamino)
                && venta.FechaProgramada.HasValue
                && venta.FechaProgramada.Value.Date >= manana)
            {
                venta.RepartoZonaId = null;
                venta.RepartidorId = null;
                venta.FechaAsignacion = null;
                venta.Estado = EstadoVenta.Pendiente;
            }
        }
        ventasZona = ventasZona.Where(v => v.RepartoZonaId == reparto.Id).ToList();

        reparto.TotalVentas = ventasZona.Count;
        reparto.TotalEntregados = ventasZona.Count(v => v.Estado == EstadoVenta.Entregado);
        reparto.TotalNoEntregados = ventasZona.Count(v => v.Estado == EstadoVenta.NoEntregado);
        reparto.TotalCancelados = ventasZona.Count(v => v.Estado == EstadoVenta.Cancelado);

        await _context.SaveChangesAsync();
        return reparto;
    }

    public async Task<List<RepartoZona>> GetRepartosAbandonadosAsync(int? localId)
    {
        var hoy = DateTime.Today;
        var query = _context.RepartosZona
            .Include(r => r.Zona)
            .Include(r => r.Repartidor)
            .Where(r => r.Estado == EstadoReparto.EnCurso && r.Fecha < hoy);

        if (localId.HasValue)
        {
            query = query.Where(r => r.Zona!.LocalId == null || r.Zona.LocalId == localId.Value);
        }

        return await query.OrderByDescending(r => r.Fecha).ThenBy(r => r.Zona!.Nombre).ToListAsync();
    }

    public async Task<List<Venta>> GetVentasByRepartoZonaIdAsync(int repartoZonaId)
    {
        return await _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.FormaPago)
            .Include(v => v.Cliente)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.RepartoZonaId == repartoZonaId)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task<List<Venta>> GetVentasByRepartoZonaIdsAsync(IEnumerable<int> repartoZonaIds, bool incluirDetalles)
    {
        var ids = repartoZonaIds.ToList();
        if (ids.Count == 0) return new List<Venta>();

        IQueryable<Venta> query = _dbSet.Where(v => v.RepartoZonaId != null && ids.Contains(v.RepartoZonaId.Value));

        if (incluirDetalles)
        {
            query = query
                .Include(v => v.Lineas)
                .Include(v => v.FormaPago)
                .Include(v => v.Cliente)
                .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
                .AsSplitQuery();
        }

        return await query.ToListAsync();
    }

    public async Task<RepartoZona?> GetRepartoZonaByIdAsync(int repartoZonaId)
    {
        return await _context.RepartosZona
            .Include(r => r.Zona)
            .Include(r => r.Repartidor)
            .FirstOrDefaultAsync(r => r.Id == repartoZonaId);
    }

    public async Task<List<RepartoZona>> GetRepartosZonaFinalizadosSinRendicionAsync(int diasAtras, int? localId)
    {
        var desde = DateTime.Today.AddDays(-diasAtras);
        var hasta = DateTime.Today;

        var query = _context.RepartosZona
            .Include(r => r.Zona)
            .Include(r => r.Repartidor)
            .Where(r => r.Estado == EstadoReparto.Finalizado
                && r.Fecha >= desde
                && r.Fecha <= hasta
                && !_context.RendicionesRepartidor.Any(rd => rd.RepartoZonaId == r.Id));

        if (localId.HasValue)
        {
            // Filtra por local de la zona (consistente con EntregasPage). Incluye zonas globales sin local.
            query = query.Where(r => r.Zona!.LocalId == null || r.Zona.LocalId == localId.Value);
        }

        return await query.OrderBy(r => r.Fecha).ToListAsync();
    }

    public async Task IncrementarContadorRepartoAsync(int zonaId, EstadoVenta estadoFinal)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso);

        if (reparto == null) return;

        switch (estadoFinal)
        {
            case EstadoVenta.Entregado:
                reparto.TotalEntregados++;
                break;
            case EstadoVenta.NoEntregado:
                reparto.TotalNoEntregados++;
                break;
            case EstadoVenta.Cancelado:
                reparto.TotalCancelados++;
                break;
        }

        await _context.SaveChangesAsync();
    }

    public async Task IncrementarTotalVentasRepartoAsync(int zonaId)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId && r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso);

        if (reparto != null)
        {
            reparto.TotalVentas++;
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

    public async Task<List<RepartoZona>> GetRepartosZonaFinalizadosHoyAsync()
    {
        var hoy = DateTime.Today;
        return await _context.RepartosZona
            .Include(r => r.Zona)
            .Include(r => r.Repartidor)
            .Where(r => r.Fecha == hoy && r.Estado == EstadoReparto.Finalizado)
            .ToListAsync();
    }

    public async Task GuardarTallyRepartoAsync(int zonaId, int repartidorId, string tallyJson)
    {
        var hoy = DateTime.Today;
        var reparto = await _context.RepartosZona
            .FirstOrDefaultAsync(r => r.ZonaId == zonaId
                && r.RepartidorId == repartidorId
                && r.Fecha == hoy
                && r.Estado == EstadoReparto.Finalizado);

        if (reparto != null)
        {
            reparto.TallyJson = tallyJson;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<RepartoZona>> GetRepartosZonaFinalizadosByFechaAsync(DateTime fecha)
    {
        return await _context.RepartosZona
            .Include(r => r.Zona)
            .Include(r => r.Repartidor)
            .Where(r => r.Fecha == fecha.Date && r.Estado == EstadoReparto.Finalizado)
            .OrderBy(r => r.FechaFinalizacion)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetActivosConProductosPorRepartidorHoyAsync()
    {
        var hoy = DateTime.Today;
        return await _dbSet
            .Include(v => v.Lineas).ThenInclude(l => l.Producto).ThenInclude(pr => pr!.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Lineas).ThenInclude(l => l.Combo).ThenInclude(c => c!.Detalles).ThenInclude(d => d.Producto).ThenInclude(pr => pr.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Repartidor)
            .Where(v => v.RepartidorId != null
                && (v.Estado == EstadoVenta.Asignado || v.Estado == EstadoVenta.EnCamino)
                && (v.FechaProgramada == null
                    ? v.FechaCreacion.Date == hoy
                    : v.FechaProgramada.Value.Date <= hoy))
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetConProductosPorRepartoZonaAsync(int repartoZonaId)
    {
        return await _dbSet
            .Include(v => v.Lineas).ThenInclude(l => l.Producto).ThenInclude(pr => pr!.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Lineas).ThenInclude(l => l.Combo).ThenInclude(c => c!.Detalles).ThenInclude(d => d.Producto).ThenInclude(pr => pr.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Repartidor)
            .Where(v => v.RepartoZonaId == repartoZonaId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetTodosConProductosPorRepartidorHoyAsync()
    {
        var hoy = DateTime.Today;

        // Solo traer ventas que pertenecen a repartos actualmente EnCurso
        var repartosEnCursoIds = await _context.RepartosZona
            .Where(r => r.Fecha == hoy && r.Estado == EstadoReparto.EnCurso)
            .Select(r => r.Id)
            .ToListAsync();

        return await _dbSet
            .Include(v => v.Lineas).ThenInclude(l => l.Producto).ThenInclude(pr => pr!.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Lineas).ThenInclude(l => l.Combo).ThenInclude(c => c!.Detalles).ThenInclude(d => d.Producto).ThenInclude(pr => pr.Categoria).ThenInclude(c => c!.CategoriaPadre)
            .Include(v => v.Repartidor)
            .Where(v => v.RepartidorId != null
                && v.RepartoZonaId != null
                && repartosEnCursoIds.Contains(v.RepartoZonaId.Value)
                && v.Estado != EstadoVenta.Cancelado
                && v.Estado != EstadoVenta.NoEntregado
                && (v.FechaProgramada == null
                    ? v.FechaCreacion.Date == hoy
                    : v.FechaProgramada.Value.Date == hoy))
            .ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByCierreCajaAsync(int cierreCajaId)
    {
        return await _dbSet
            .Include(v => v.FormaPago)
            .Include(v => v.Pagos).ThenInclude(pg => pg.FormaPago)
            .Where(v => v.CierreCajaId == cierreCajaId && v.Estado != EstadoVenta.Cancelado && v.Estado != EstadoVenta.NoEntregado)
            .ToListAsync();
    }

    public async Task<int> GetCountByFechaAsync(DateTime fecha, int? localId = null, int? tipo = null)
    {
        var q = _dbSet
            .Where(v => v.FechaCreacion.Date == fecha.Date
                && v.Estado != EstadoVenta.Cancelado
                && v.Estado != EstadoVenta.NoEntregado);
        if (localId.HasValue) q = q.Where(v => v.LocalId == localId.Value);
        if (tipo.HasValue) q = q.Where(v => (int)v.Tipo == tipo.Value);
        return await q.CountAsync();
    }

    public async Task<int> GetCountByRangoAsync(DateTime desde, DateTime hasta, int? localId = null, int? tipo = null)
    {
        var q = _dbSet
            .Where(v => v.FechaCreacion.Date >= desde.Date
                && v.FechaCreacion.Date <= hasta.Date
                && v.Estado != EstadoVenta.Cancelado
                && v.Estado != EstadoVenta.NoEntregado);
        if (localId.HasValue) q = q.Where(v => v.LocalId == localId.Value);
        if (tipo.HasValue) q = q.Where(v => (int)v.Tipo == tipo.Value);
        return await q.CountAsync();
    }

    public async Task<(decimal Total, int Count)> GetTotalesByFechaAsync(DateTime fecha, int? localId = null, int? tipo = null)
    {
        var q = _dbSet
            .Where(v => v.FechaCreacion.Date == fecha.Date
                && v.Estado != EstadoVenta.Cancelado
                && v.Estado != EstadoVenta.NoEntregado);
        if (localId.HasValue) q = q.Where(v => v.LocalId == localId.Value);
        if (tipo.HasValue) q = q.Where(v => (int)v.Tipo == tipo.Value);
        var resultado = await q
            .GroupBy(_ => 1)
            .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
            .FirstOrDefaultAsync();

        return resultado is null ? (0m, 0) : (resultado.Total, resultado.Count);
    }

    public async Task<IEnumerable<Venta>> GetVentasDepositoAsync(DateTime desde, int? localId)
    {
        var query = _dbSet
            .Include(v => v.Lineas)
            .Include(v => v.Pagos).ThenInclude(p => p.FormaPago)
            .Include(v => v.FormaPago)
            .Where(v => !v.VencidoDeposito)
            .Where(v => v.FechaCreacion >= desde
                || (v.FechaEnvioDeposito != null && v.FechaEnvioDeposito >= desde));

        if (localId.HasValue)
            query = query.Where(v => v.LocalId == localId.Value || v.LocalId == null);

        return await query
            .OrderBy(v => v.FechaCreacion)
            .ToListAsync();
    }

    public async Task<int> GetSiguienteNumeroVentaAsync(DateTime fecha)
    {
        var count = await _dbSet
            .Where(v => v.FechaCreacion.Date == fecha.Date)
            .CountAsync();
        return count + 1;
    }

    public async Task<IEnumerable<Venta>> GetVentasHoyConLineasAsync(int? localId = null)
    {
        var hoy = DateTime.Today;
        var query = _dbSet
            .Include(v => v.Lineas).ThenInclude(l => l.Producto)
            .Include(v => v.Lineas).ThenInclude(l => l.Combo)
            .Where(v => v.FechaCreacion.Date == hoy
                && v.Estado != EstadoVenta.Cancelado
                && v.Estado != EstadoVenta.NoEntregado);

        if (localId.HasValue)
            query = query.Where(v => v.LocalId == localId.Value);

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Venta>> GetByLocalAsync(int localId, DateTime? desde = null, DateTime? hasta = null)
    {
        var query = _dbSet
            .Include(v => v.Cliente)
            .Include(v => v.FormaPago)
            .Include(v => v.Local)
            .Include(v => v.Usuario)
            .Where(v => v.LocalId == localId);

        if (desde.HasValue)
            query = query.Where(v => v.FechaCreacion.Date >= desde.Value.Date);

        if (hasta.HasValue)
            query = query.Where(v => v.FechaCreacion.Date <= hasta.Value.Date);

        return await query
            .OrderByDescending(v => v.FechaCreacion)
            .ToListAsync();
    }
}
