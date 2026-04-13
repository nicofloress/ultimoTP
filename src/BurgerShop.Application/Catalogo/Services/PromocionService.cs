using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class PromocionService : IPromocionService
{
    private readonly IPromocionRepository _repo;

    public PromocionService(IPromocionRepository repo) => _repo = repo;

    public async Task<IEnumerable<PromocionDto>> GetAllAsync()
    {
        var promociones = await _repo.GetAllConDetallesAsync();
        return promociones.Select(ToDto);
    }

    public async Task<PromocionDto?> GetByIdAsync(int id)
    {
        var promo = await _repo.GetByIdConDetallesAsync(id);
        return promo is null ? null : ToDto(promo);
    }

    public async Task<IEnumerable<PromocionDto>> GetVigentesParaLocalAsync(int localId)
    {
        var promociones = await _repo.GetVigentesParaLocalAsync(localId);
        return promociones.Select(ToDto);
    }

    public async Task<PromocionDto> CreateAsync(CrearPromocionDto dto)
    {
        var promo = new Promocion
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            FechaDesde = dto.FechaDesde,
            FechaHasta = dto.FechaHasta,
            TipoDescuento = dto.TipoDescuento,
            ValorDescuento = dto.ValorDescuento,
            Activa = true,
            FechaCreacion = DateTime.Now,
            Items = dto.Items.Select(i => new PromocionItem
            {
                ProductoId = i.ProductoId,
                ComboId = i.ComboId,
                PrecioPromo = i.PrecioPromo
            }).ToList(),
            Locales = dto.LocalIds.Select(localId => new PromocionLocal
            {
                LocalId = localId
            }).ToList()
        };

        await _repo.AddAsync(promo);
        await _repo.SaveChangesAsync();

        var created = await _repo.GetByIdConDetallesAsync(promo.Id);
        return ToDto(created!);
    }

    public async Task<PromocionDto?> UpdateAsync(int id, ActualizarPromocionDto dto)
    {
        var promo = await _repo.GetByIdConDetallesAsync(id);
        if (promo is null) return null;

        promo.Nombre = dto.Nombre;
        promo.Descripcion = dto.Descripcion;
        promo.FechaDesde = dto.FechaDesde;
        promo.FechaHasta = dto.FechaHasta;
        promo.TipoDescuento = dto.TipoDescuento;
        promo.ValorDescuento = dto.ValorDescuento;
        promo.Activa = dto.Activa;

        promo.Items.Clear();
        foreach (var item in dto.Items)
        {
            promo.Items.Add(new PromocionItem
            {
                PromocionId = id,
                ProductoId = item.ProductoId,
                ComboId = item.ComboId,
                PrecioPromo = item.PrecioPromo
            });
        }

        promo.Locales.Clear();
        foreach (var localId in dto.LocalIds)
        {
            promo.Locales.Add(new PromocionLocal
            {
                PromocionId = id,
                LocalId = localId
            });
        }

        _repo.Update(promo);
        await _repo.SaveChangesAsync();

        var updated = await _repo.GetByIdConDetallesAsync(id);
        return ToDto(updated!);
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var promo = await _repo.GetByIdAsync(id);
        if (promo is null) return false;

        promo.Activa = false;
        _repo.Update(promo);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var promo = await _repo.GetByIdAsync(id);
        if (promo is null) return false;

        _repo.Remove(promo);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static PromocionDto ToDto(Promocion p) => new(
        p.Id,
        p.Nombre,
        p.Descripcion,
        p.FechaDesde,
        p.FechaHasta,
        p.TipoDescuento,
        p.ValorDescuento,
        p.Activa,
        p.FechaCreacion,
        p.Items.Select(i => new PromocionItemDto(
            i.Id,
            i.ProductoId,
            i.Producto?.Nombre,
            i.ComboId,
            i.Combo?.Nombre,
            i.PrecioPromo
        )).ToList(),
        p.Locales.Select(l => new PromocionLocalDto(
            l.LocalId,
            l.Local?.Nombre ?? string.Empty
        )).ToList()
    );
}
