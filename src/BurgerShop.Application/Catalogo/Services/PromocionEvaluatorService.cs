using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Application.Catalogo.Promociones;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces.Catalogo;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Catalogo.Services;

public class PromocionEvaluatorService : IPromocionEvaluatorService
{
    private readonly IPromocionRepository _promoRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IDictionary<TipoCondicion, IPromocionConditionEvaluator> _evaluators;
    private readonly ILogger<PromocionEvaluatorService> _logger;

    public PromocionEvaluatorService(
        IPromocionRepository promoRepo,
        IProductoRepository productoRepo,
        IEnumerable<IPromocionConditionEvaluator> evaluators,
        ILogger<PromocionEvaluatorService> logger)
    {
        _promoRepo = promoRepo;
        _productoRepo = productoRepo;
        _evaluators = evaluators.ToDictionary(e => e.Tipo);
        _logger = logger;
    }

    public async Task<EvaluarPromocionesResultDto> EvaluarAsync(EvaluarPromocionesContextDto ctx)
    {
        var fecha = ctx.Fecha ?? DateTime.Now;
        var subtotalOriginal = ctx.Items.Sum(i => i.Cantidad * i.PrecioUnitario);

        // Resolver categorías de productos para condiciones por categoría
        var productosIds = ctx.Items.Where(i => i.ProductoId.HasValue).Select(i => i.ProductoId!.Value).Distinct().ToList();
        var categoriasPorProducto = new Dictionary<int, int>();
        if (productosIds.Count > 0)
        {
            foreach (var pid in productosIds)
            {
                var prod = await _productoRepo.GetByIdAsync(pid);
                if (prod != null) categoriasPorProducto[pid] = prod.CategoriaId;
            }
        }

        var contextoEval = new EvaluacionContexto(
            Fecha: fecha,
            FormaPagoId: ctx.FormaPagoId,
            TipoVenta: ctx.TipoVenta,
            LocalId: ctx.LocalId,
            ClienteId: ctx.ClienteId,
            Subtotal: subtotalOriginal,
            CantidadTotalItems: ctx.Items.Sum(i => i.Cantidad),
            Items: ctx.Items.Select(i => new EvaluacionItem(
                i.ProductoId,
                i.ComboId,
                i.ProductoId.HasValue && categoriasPorProducto.TryGetValue(i.ProductoId.Value, out var cat) ? cat : null,
                i.Cantidad,
                i.PrecioUnitario
            )).ToList()
        );

        var promosVigentes = (await _promoRepo.GetVigentesParaLocalAsync(ctx.LocalId)).ToList();

        var aplicables = promosVigentes
            .Where(p => CumpleTipoVenta(p, ctx.TipoVenta))
            .Where(p => CumpleTodasLasCondiciones(p, contextoEval))
            .Where(p => HayItemsAfectados(p, ctx.Items))
            .OrderByDescending(p => p.Prioridad)
            .ThenBy(p => p.Id)
            .ToList();

        // Resolver acumulación: si hay no-acumulables, gana la de mayor prioridad
        // y se descartan otras no-acumulables. Acumulables siempre se aplican.
        var seleccionadas = new List<Promocion>();
        var noAcumulableElegida = false;
        foreach (var p in aplicables)
        {
            if (p.Acumulable)
            {
                seleccionadas.Add(p);
            }
            else if (!noAcumulableElegida)
            {
                seleccionadas.Add(p);
                noAcumulableElegida = true;
            }
        }

        // IDs de productos/combos cubiertos por una promo per-item (Items.Count > 0).
        // Las promos "blanket" (Items.Count == 0, tipicamente forma de pago)
        // NO deben tocar estos items: si un articulo ya tiene su precio promo
        // por ser parte de una promo de producto, no acumula con la de medio
        // de pago.
        var productoIdsConPromoItem = seleccionadas
            .Where(p => p.Items.Count > 0)
            .SelectMany(p => p.Items)
            .Where(pi => pi.ProductoId.HasValue)
            .Select(pi => pi.ProductoId!.Value)
            .ToHashSet();
        var comboIdsConPromoItem = seleccionadas
            .Where(p => p.Items.Count > 0)
            .SelectMany(p => p.Items)
            .Where(pi => pi.ComboId.HasValue)
            .Select(pi => pi.ComboId!.Value)
            .ToHashSet();

        var promosAplicadas = new List<PromocionAplicadaDto>();
        decimal totalDescuento = 0m;
        decimal totalReintegro = 0m;

        foreach (var promo in seleccionadas)
        {
            var resultado = CalcularBeneficio(promo, ctx.Items, productoIdsConPromoItem, comboIdsConPromoItem);
            if (resultado.monto <= 0) continue;
            if (resultado.esReintegro)
            {
                totalReintegro += resultado.monto;
                promosAplicadas.Add(new PromocionAplicadaDto(
                    promo.Id, promo.Nombre, promo.TipoBeneficio,
                    MontoDescuento: 0m,
                    MontoReintegro: resultado.monto,
                    EsReintegro: true
                ));
            }
            else
            {
                totalDescuento += resultado.monto;
                promosAplicadas.Add(new PromocionAplicadaDto(
                    promo.Id, promo.Nombre, promo.TipoBeneficio,
                    MontoDescuento: resultado.monto,
                    MontoReintegro: null,
                    EsReintegro: false
                ));
            }
        }

        // No descontar más que el subtotal
        if (totalDescuento > subtotalOriginal) totalDescuento = subtotalOriginal;

        var totalFinal = subtotalOriginal - totalDescuento;

        return new EvaluarPromocionesResultDto(
            SubtotalOriginal: Math.Round(subtotalOriginal, 2),
            TotalDescuento: Math.Round(totalDescuento, 2),
            TotalReintegro: Math.Round(totalReintegro, 2),
            TotalFinal: Math.Round(totalFinal, 2),
            Promociones: promosAplicadas
        );
    }

    private static bool CumpleTipoVenta(Promocion p, int tipoVenta)
    {
        if (p.TiposVenta.Count == 0) return true; // sin filtro = aplica a todos
        return p.TiposVenta.Any(tv => (int)tv.TipoVenta == tipoVenta);
    }

    private bool CumpleTodasLasCondiciones(Promocion p, EvaluacionContexto ctx)
    {
        foreach (var cond in p.Condiciones)
        {
            if (!_evaluators.TryGetValue(cond.Tipo, out var evaluator))
            {
                _logger.LogWarning("No hay evaluator registrado para condición tipo {Tipo} (promo {PromoId})", cond.Tipo, p.Id);
                return false;
            }
            if (!evaluator.Evaluate(cond.Valor, ctx)) return false;
        }
        return true;
    }

    private static bool HayItemsAfectados(Promocion p, IReadOnlyList<EvaluarPromocionItemDto> items)
    {
        if (p.Items.Count == 0) return true; // sin items = aplica al total
        return p.Items.Any(pi =>
            (pi.ProductoId.HasValue && items.Any(i => i.ProductoId == pi.ProductoId)) ||
            (pi.ComboId.HasValue && items.Any(i => i.ComboId == pi.ComboId)));
    }

    private static (decimal monto, bool esReintegro) CalcularBeneficio(
        Promocion p,
        IReadOnlyList<EvaluarPromocionItemDto> items,
        ISet<int> productoIdsConPromoItem,
        ISet<int> comboIdsConPromoItem)
    {
        var subtotalAfectado = SubtotalAfectado(p, items, productoIdsConPromoItem, comboIdsConPromoItem);
        decimal monto = p.TipoBeneficio switch
        {
            TipoBeneficio.PorcentajeDescuento => subtotalAfectado * (p.ValorBeneficio / 100m),
            TipoBeneficio.MontoFijoDescuento => Math.Min(p.ValorBeneficio, subtotalAfectado),
            TipoBeneficio.PrecioFijoItems => CalcularPrecioFijoItems(p, items),
            TipoBeneficio.ReintegroPorcentaje => subtotalAfectado * (p.ValorBeneficio / 100m),
            TipoBeneficio.ReintegroMonto => p.ValorBeneficio,
            _ => 0m
        };

        if (p.TopeMaximo.HasValue && monto > p.TopeMaximo.Value)
            monto = p.TopeMaximo.Value;

        var esReintegro = p.TipoBeneficio is TipoBeneficio.ReintegroPorcentaje or TipoBeneficio.ReintegroMonto;
        return (monto, esReintegro);
    }

    private static decimal SubtotalAfectado(
        Promocion p,
        IReadOnlyList<EvaluarPromocionItemDto> items,
        ISet<int> productoIdsConPromoItem,
        ISet<int> comboIdsConPromoItem)
    {
        if (p.Items.Count == 0)
        {
            // Promo blanket (sin items): aplica solo a items NO cubiertos por
            // alguna promo per-item. Asi una promo de forma de pago no acumula
            // con un producto que ya tiene su propio precio promo.
            return items
                .Where(i =>
                    !(i.ProductoId.HasValue && productoIdsConPromoItem.Contains(i.ProductoId.Value)) &&
                    !(i.ComboId.HasValue && comboIdsConPromoItem.Contains(i.ComboId.Value)))
                .Sum(i => i.Cantidad * i.PrecioUnitario);
        }
        decimal total = 0m;
        foreach (var item in items)
        {
            var match = p.Items.Any(pi =>
                (pi.ProductoId.HasValue && pi.ProductoId == item.ProductoId) ||
                (pi.ComboId.HasValue && pi.ComboId == item.ComboId));
            if (match) total += item.Cantidad * item.PrecioUnitario;
        }
        return total;
    }

    private static decimal CalcularPrecioFijoItems(Promocion p, IReadOnlyList<EvaluarPromocionItemDto> items)
    {
        decimal descuento = 0m;
        foreach (var promoItem in p.Items)
        {
            if (!promoItem.PrecioPromo.HasValue) continue;
            foreach (var item in items)
            {
                var match =
                    (promoItem.ProductoId.HasValue && promoItem.ProductoId == item.ProductoId) ||
                    (promoItem.ComboId.HasValue && promoItem.ComboId == item.ComboId);
                if (!match) continue;
                var diferencia = item.PrecioUnitario - promoItem.PrecioPromo.Value;
                if (diferencia > 0)
                    descuento += diferencia * item.Cantidad;
            }
        }
        return descuento;
    }
}
