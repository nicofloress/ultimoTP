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

// DTO de lectura para una condición
public record PromocionCondicionDto(
    int Id,
    TipoCondicion Tipo,
    string Valor
);

// DTO de creación/actualización para una condición
public record CrearPromocionCondicionDto(
    TipoCondicion Tipo,
    string Valor
);

// DTO de lectura completo
public record PromocionDto(
    int Id,
    string Nombre,
    string? Descripcion,
    DateTime FechaDesde,
    DateTime FechaHasta,
    TipoBeneficio TipoBeneficio,
    decimal ValorBeneficio,
    decimal? TopeMaximo,
    bool Acumulable,
    int Prioridad,
    bool Activa,
    DateTime FechaCreacion,
    List<PromocionItemDto> Items,
    List<PromocionLocalDto> Locales,
    List<int> TiposVenta,
    List<PromocionCondicionDto> Condiciones
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
    TipoBeneficio TipoBeneficio,
    decimal ValorBeneficio,
    List<CrearPromocionItemDto> Items,
    List<int> LocalIds,
    List<int>? TiposVenta = null,
    List<CrearPromocionCondicionDto>? Condiciones = null,
    decimal? TopeMaximo = null,
    bool Acumulable = true,
    int Prioridad = 0
);

// DTO de actualización (incluye Activa)
public record ActualizarPromocionDto(
    string Nombre,
    string? Descripcion,
    DateTime FechaDesde,
    DateTime FechaHasta,
    TipoBeneficio TipoBeneficio,
    decimal ValorBeneficio,
    bool Activa,
    List<CrearPromocionItemDto> Items,
    List<int> LocalIds,
    List<int>? TiposVenta = null,
    List<CrearPromocionCondicionDto>? Condiciones = null,
    decimal? TopeMaximo = null,
    bool Acumulable = true,
    int Prioridad = 0
);

// DTO para evaluación de promociones en el POS
public record EvaluarPromocionesContextDto(
    int LocalId,
    int? FormaPagoId,
    int TipoVenta,
    DateTime? Fecha,
    int? ClienteId,
    List<EvaluarPromocionItemDto> Items
);

public record EvaluarPromocionItemDto(
    int? ProductoId,
    int? ComboId,
    int Cantidad,
    decimal PrecioUnitario
);

public record PromocionAplicadaDto(
    int PromocionId,
    string Nombre,
    TipoBeneficio TipoBeneficio,
    decimal MontoDescuento,
    decimal? MontoReintegro,
    bool EsReintegro
);

public record EvaluarPromocionesResultDto(
    decimal SubtotalOriginal,
    decimal TotalDescuento,
    decimal TotalReintegro,
    decimal TotalFinal,
    List<PromocionAplicadaDto> Promociones
);
