using BurgerShop.Domain.Enums;

namespace BurgerShop.Application.Catalogo.DTOs;

// DTO de lectura para un item dentro de la promoción
public record PromocionItemDto(
    int Id,
    int? ProductoId,
    string? ProductoNombre,
    int? ComboId,
    string? ComboNombre,
    decimal? PrecioPromo
);

// DTO de lectura para la asociación con local
public record PromocionLocalDto(
    int LocalId,
    string LocalNombre
);

// DTO de lectura completo
public record PromocionDto(
    int Id,
    string Nombre,
    string? Descripcion,
    DateTime FechaDesde,
    DateTime FechaHasta,
    TipoDescuento TipoDescuento,
    decimal ValorDescuento,
    bool Activa,
    DateTime FechaCreacion,
    List<PromocionItemDto> Items,
    List<PromocionLocalDto> Locales
);

// DTO de creación para cada item
public record CrearPromocionItemDto(
    int? ProductoId,
    int? ComboId,
    decimal? PrecioPromo
);

// DTO de creación de la promoción
public record CrearPromocionDto(
    string Nombre,
    string? Descripcion,
    DateTime FechaDesde,
    DateTime FechaHasta,
    TipoDescuento TipoDescuento,
    decimal ValorDescuento,
    List<CrearPromocionItemDto> Items,
    List<int> LocalIds
);

// DTO de actualización (incluye Activa)
public record ActualizarPromocionDto(
    string Nombre,
    string? Descripcion,
    DateTime FechaDesde,
    DateTime FechaHasta,
    TipoDescuento TipoDescuento,
    decimal ValorDescuento,
    bool Activa,
    List<CrearPromocionItemDto> Items,
    List<int> LocalIds
);
