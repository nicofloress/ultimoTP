using BurgerShop.Application.Finanzas.DTOs;
using BurgerShop.Application.Finanzas.Interfaces;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Interfaces.Finanzas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Finanzas.Services;

public class GastoService : IGastoService
{
    private readonly IGastoRepository _repo;
    private readonly ILogger<GastoService> _logger;

    public GastoService(IGastoRepository repo, ILogger<GastoService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<GastoDto>> GetAllAsync(int? localId = null)
    {
        try
        {
            IEnumerable<Gasto> gastos;

            if (localId.HasValue)
                gastos = await _repo.GetByLocalAsync(localId.Value);
            else
                gastos = await _repo.GetAllConDetallesAsync();

            return gastos.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<GastoDto?> GetByIdAsync(int id)
    {
        try
        {
            var gasto = await _repo.GetByIdConDetallesAsync(id);
            return gasto is null ? null : ToDto(gasto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<GastoStatsDto> GetStatsAsync(int? localId = null)
    {
        try
        {
            IEnumerable<Gasto> gastos;

            if (localId.HasValue)
                gastos = await _repo.GetByLocalAsync(localId.Value);
            else
                gastos = await _repo.GetAllConDetallesAsync();

            var lista = gastos.ToList();

            return new GastoStatsDto(
                CantidadGastos: lista.Count,
                GastosPagados: lista.Count(g => g.Pagado),
                GastosAdeudados: lista.Count(g => !g.Pagado),
                GastosTotal: lista.Sum(g => g.Total));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetStatsAsync), ex.Message);
            throw;
        }
    }

    public async Task<GastoDto> CreateAsync(CrearGastoDto dto, int? usuarioId = null)
    {
        try
        {
            var gasto = new Gasto
            {
                Nombre = dto.Nombre,
                FechaGasto = dto.FechaGasto,
                FechaVencimiento = dto.FechaVencimiento,
                Categoria = dto.Categoria,
                Proveedor = dto.Proveedor,
                Etiqueta = dto.Etiqueta,
                FormaPagoId = dto.FormaPagoId,
                Subtotal = dto.Subtotal,
                Iva = dto.Iva,
                Total = dto.Total,
                Deuda = dto.Deuda,
                Pagado = dto.Pagado,
                Observaciones = dto.Observaciones,
                LocalId = dto.LocalId,
                UsuarioId = usuarioId,
                FechaCreacion = DateTime.Now,
                Activo = true
            };

            await _repo.AddAsync(gasto);
            await _repo.SaveChangesAsync();

            var creado = await _repo.GetByIdConDetallesAsync(gasto.Id);
            return ToDto(creado!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<GastoDto?> UpdateAsync(int id, ActualizarGastoDto dto)
    {
        try
        {
            var gasto = await _repo.GetByIdAsync(id);
            if (gasto is null) return null;

            gasto.Nombre = dto.Nombre;
            gasto.FechaGasto = dto.FechaGasto;
            gasto.FechaVencimiento = dto.FechaVencimiento;
            gasto.Categoria = dto.Categoria;
            gasto.Proveedor = dto.Proveedor;
            gasto.Etiqueta = dto.Etiqueta;
            gasto.FormaPagoId = dto.FormaPagoId;
            gasto.Subtotal = dto.Subtotal;
            gasto.Iva = dto.Iva;
            gasto.Total = dto.Total;
            gasto.Deuda = dto.Deuda;
            gasto.Pagado = dto.Pagado;
            gasto.Observaciones = dto.Observaciones;
            gasto.LocalId = dto.LocalId;

            _repo.Update(gasto);
            await _repo.SaveChangesAsync();

            var actualizado = await _repo.GetByIdConDetallesAsync(id);
            return ToDto(actualizado!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var gasto = await _repo.GetByIdAsync(id);
            if (gasto is null) return false;

            gasto.Activo = false;
            _repo.Update(gasto);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static GastoDto ToDto(Gasto g) => new(
        g.Id,
        g.Nombre,
        g.FechaGasto,
        g.FechaVencimiento,
        g.Categoria,
        g.Proveedor,
        g.Etiqueta,
        g.FormaPagoId,
        g.FormaPago?.Nombre,
        g.Subtotal,
        g.Iva,
        g.Total,
        g.Deuda,
        g.Pagado,
        g.Observaciones,
        g.LocalId,
        g.Local?.Nombre,
        g.UsuarioId,
        g.FechaCreacion,
        g.Activo);
}
