using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Logistica;
using ClosedXML.Excel;

namespace BurgerShop.Application.Logistica.Services;

public class ControlCamionetaService : IControlCamionetaService
{
    private readonly IPedidoRepository _pedidoRepo;
    private readonly IRepartidorRepository _repartidorRepo;

    public ControlCamionetaService(IPedidoRepository pedidoRepo, IRepartidorRepository repartidorRepo)
    {
        _pedidoRepo = pedidoRepo;
        _repartidorRepo = repartidorRepo;
    }

    public async Task<byte[]> GenerarExcelAsync(IEnumerable<(int ZonaId, int RepartidorId)> asignaciones)
    {
        var pedidos = (await _pedidoRepo.GetListosParaRepartoConProductosAsync()).ToList();
        var asignacionesList = asignaciones.ToList();
        var zonaRepartidor = asignacionesList.ToDictionary(a => a.ZonaId, a => a.RepartidorId);

        // Cargar repartidores
        var repartidores = new Dictionary<int, (string Nombre, string? Vehiculo)>();
        foreach (var repId in asignacionesList.Select(a => a.RepartidorId).Distinct())
        {
            var rep = await _repartidorRepo.GetByIdAsync(repId);
            if (rep != null)
                repartidores[repId] = (rep.Nombre, rep.Vehiculo);
        }

        // Agrupar pedidos por repartidor
        var pedidosPorRepartidor = new Dictionary<int, List<Pedido>>();
        foreach (var pedido in pedidos)
        {
            if (pedido.ZonaId == null || !zonaRepartidor.TryGetValue(pedido.ZonaId.Value, out var repId))
                continue;
            if (pedido.Estado != EstadoPedido.EnPreparacion)
                continue;

            if (!pedidosPorRepartidor.ContainsKey(repId))
                pedidosPorRepartidor[repId] = new List<Pedido>();
            pedidosPorRepartidor[repId].Add(pedido);
        }

        using var workbook = new XLWorkbook();

        foreach (var (repartidorId, pedidosRep) in pedidosPorRepartidor)
        {
            var (nombre, vehiculo) = repartidores.GetValueOrDefault(repartidorId, ("Desconocido", null));
            var tallies = CalcularTallies(pedidosRep);
            GenerarHoja(workbook, nombre, vehiculo, tallies);
        }

        if (workbook.Worksheets.Count == 0)
        {
            var ws = workbook.Worksheets.Add("Sin datos");
            ws.Cell("A1").Value = "No hay pedidos para este reparto";
        }

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    #region Tally Calculation

    private class TallyData
    {
        // Carnes: PesoGramos → (Completa, Media)
        // Medallones económicos: 55, 69, 80, 110
        public Dictionary<int, (int Completa, int Media)> Medallones { get; } = new()
        {
            [55] = default,
            [69] = default,
            [80] = default,
            [110] = default
        };

        // Premium: 80, 110, 120, 160, 198 (no existe 69gr Premium)
        public Dictionary<int, (int Completa, int Media)> Premium { get; } = new()
        {
            [80] = default,
            [110] = default,
            [120] = default,
            [160] = default,
            [198] = default
        };

        // Salchichas: (Completa, Media)
        public (int Completa, int Media) SalchichaCorta { get; set; }
        public (int Completa, int Media) SalchichaLarga { get; set; }

        // Panes: la cantidad del combo ES la key → palotes (1 palote = 1 paquete de esa cantidad)
        // Las keys se generan dinámicamente según lo que aparezca
        public Dictionary<int, int> PanTradicional { get; } = new();
        public Dictionary<int, int> PanMaxi { get; } = new();
        public Dictionary<int, int> PanPancho { get; } = new();
        public Dictionary<int, int> PanSuperPancho { get; } = new();

        // Aderezos: nombre del producto → cantidad total
        public Dictionary<string, int> Aderezos { get; } = new();

        public int Otros { get; set; }
    }

    private TallyData CalcularTallies(List<Pedido> pedidos)
    {
        var data = new TallyData();

        foreach (var pedido in pedidos)
        {
            foreach (var linea in pedido.Lineas)
            {
                if (linea.ComboId != null && linea.Combo != null)
                {
                    // Los combos ya incluyen panes y aderezos como ComboDetalle explícito
                    // No auto-agregar nada: contar exactamente lo que viene
                    foreach (var detalle in linea.Combo.Detalles)
                    {
                        if (detalle.Producto != null)
                            ProcesarProducto(data, detalle.Producto, linea.Cantidad * detalle.Cantidad);
                    }
                }
                else if (linea.ProductoId != null && linea.Producto != null)
                {
                    ProcesarProducto(data, linea.Producto, linea.Cantidad);
                }
            }
        }

        return data;
    }

    private void ProcesarProducto(TallyData data, Producto producto, int cantidad)
    {
        if (cantidad <= 0) return;

        var seccion = producto.Categoria?.SeccionCamioneta ?? SeccionCamioneta.Otro;
        var peso = producto.PesoGramos ?? 0;
        var bulto = producto.UnidadesPorBulto;
        var media = producto.UnidadesPorMedia;

        switch (seccion)
        {
            case SeccionCamioneta.MedallonEconomico:
                // Contar cuántas completas y medias entran en la cantidad recibida
                ContarCompletaMedia(data.Medallones, peso, cantidad, bulto, media);
                // NO auto-agregar panes: los combos ya los traen explícitamente
                break;

            case SeccionCamioneta.HamburguesaPremium:
                ContarCompletaMedia(data.Premium, peso, cantidad, bulto, media);
                // NO auto-agregar panes: los combos ya los traen explícitamente
                break;

            case SeccionCamioneta.SalchichaCorta:
            {
                var (c, m) = ContarCompletaMediaSimple(cantidad, bulto, media);
                data.SalchichaCorta = (data.SalchichaCorta.Completa + c, data.SalchichaCorta.Media + m);
                // NO auto-agregar panes Pancho
                break;
            }

            case SeccionCamioneta.SalchichaLarga:
            {
                var (c, m) = ContarCompletaMediaSimple(cantidad, bulto, media);
                data.SalchichaLarga = (data.SalchichaLarga.Completa + c, data.SalchichaLarga.Media + m);
                // NO auto-agregar SuperPanchos
                break;
            }

            case SeccionCamioneta.PanTradicional:
                // La cantidad del combo (ej: 30 panes) ES la key del tally; se suma 1 palote
                TallyPan(data.PanTradicional, cantidad);
                break;

            case SeccionCamioneta.PanMaxi:
                TallyPan(data.PanMaxi, cantidad);
                break;

            case SeccionCamioneta.PanPancho:
                TallyPan(data.PanPancho, cantidad);
                break;

            case SeccionCamioneta.PanSuperPancho:
                TallyPan(data.PanSuperPancho, cantidad);
                break;

            case SeccionCamioneta.Aderezo:
                // Usar el nombre del producto directamente; acumular cantidad total
                var nombreAderezo = producto.Nombre.ToUpperInvariant();
                data.Aderezos[nombreAderezo] = data.Aderezos.GetValueOrDefault(nombreAderezo) + cantidad;
                break;

            default:
                data.Otros += cantidad;
                break;
        }
    }

    /// <summary>
    /// Para medallones y premium: determina cuántas completas y medias entran
    /// en la cantidad recibida y las acumula en el diccionario bajo la key dada.
    /// </summary>
    private static void ContarCompletaMedia(
        Dictionary<int, (int Completa, int Media)> dict,
        int key,
        int cantidad,
        int unidadesPorBulto,
        int unidadesPorMedia)
    {
        if (!dict.ContainsKey(key)) return;

        var (completa, mediaCnt) = ContarCompletaMediaSimple(cantidad, unidadesPorBulto, unidadesPorMedia);
        var anterior = dict[key];
        dict[key] = (anterior.Completa + completa, anterior.Media + mediaCnt);
    }

    /// <summary>
    /// Calcula cuántas completas y medias entran en una cantidad de unidades,
    /// dado el tamaño de bulto y media.
    /// Ejemplo: cantidad=30, bulto=60, media=30 → 0 completas, 1 media.
    ///          cantidad=60, bulto=60, media=30 → 1 completa, 0 medias.
    ///          cantidad=90, bulto=60, media=30 → 1 completa, 1 media.
    /// </summary>
    private static (int Completa, int Media) ContarCompletaMediaSimple(int cantidad, int bulto, int media)
    {
        if (bulto <= 0) return (0, 0);

        var completas = cantidad / bulto;
        var restante = cantidad % bulto;
        var medias = (media > 0 && restante > 0) ? restante / media : 0;

        return (completas, medias);
    }

    /// <summary>
    /// Para panes: la cantidad del combo ES la key del tally.
    /// Se suma 1 palote por cada vez que se pide ese paquete de cantidad.
    /// Ejemplo: si un combo pide 30 panes tradicionales → TallyPan(dict, 30) → dict[30]++
    /// </summary>
    private static void TallyPan(Dictionary<int, int> dict, int cantidad)
    {
        if (cantidad <= 0) return;
        dict[cantidad] = dict.GetValueOrDefault(cantidad) + 1;
    }

    #endregion

    #region Excel Generation

    // ── Colores pastel exactos del Excel original ──────────────────────────
    private static readonly XLColor CHeaderFila1  = XLColor.FromHtml("#BDD7EE"); // Azul pastel (REPARTIDOR/CAMIONETA/FECHA)
    private static readonly XLColor CDorado       = XLColor.FromHtml("#FFE699"); // Dorado pastel (Medallones Eco, TRADICIONAL)
    private static readonly XLColor CVerde        = XLColor.FromHtml("#A9D18E"); // Verde pastel (Premium, MAXIHAMBURGUESA)
    private static readonly XLColor CAzulCielo    = XLColor.FromHtml("#B4C7E7"); // Azul cielo pastel (Salch.Cortas, PANCHO)
    private static readonly XLColor CNaranja      = XLColor.FromHtml("#F4B183"); // Naranja/salmón pastel (Salch.Largas, SUPERPANCHOS)
    private static readonly XLColor CGris         = XLColor.FromHtml("#E7E6E6"); // Gris claro (COMPLETA/MEDIA, PANES header)
    private static readonly XLColor CAmarillo     = XLColor.FromHtml("#FFFF00"); // Amarillo (ADEREZOS, SALSAS)
    private static readonly XLColor CAzulSolido   = XLColor.FromHtml("#4472C4"); // Azul sólido (fila OTROS R29)

    private void GenerarHoja(XLWorkbook workbook, string repartidor, string? vehiculo, TallyData t)
    {
        var sheetName = repartidor.Length > 31 ? repartidor[..31] : repartidor;
        var ws = workbook.Worksheets.Add(sheetName);

        // ── Anchos de columna exactos del original ──
        ws.Column(1).Width = 15.71;
        ws.Column(2).Width = 15.71;
        ws.Column(3).Width = 15.71;
        ws.Column(4).Width = 15.14;
        ws.Column(5).Width = 12.57;
        ws.Column(6).Width = 14.57;

        // ── Altura de filas ──
        ws.Row(1).Height = 15.75;
        for (var r = 2; r <= 29; r++)
            ws.Row(r).Height = 18;

        const int fs = 11; // font size uniforme

        // ════════════════════════════════════════════════════════════════════
        // LAYOUT FIJO - 29 filas
        // ════════════════════════════════════════════════════════════════════

        // ── R01: REPARTIDOR / CAMIONETA / FECHA ──────────────────────────
        SetCell(ws, 1, 1, "REPARTIDOR",                    fs, bold: true,  bg: CHeaderFila1);
        SetCell(ws, 1, 2, repartidor,                      fs);
        SetCell(ws, 1, 3, "CAMIONETA",                     fs, bold: true,  bg: CHeaderFila1);
        SetCell(ws, 1, 4, vehiculo ?? "-",                  fs);
        SetCell(ws, 1, 5, "FECHA",                         fs, bold: true,  bg: CHeaderFila1);
        SetCell(ws, 1, 6, DateTime.Today.ToString("d/M/yyyy"), fs);

        // ── R02: Header MEDALLONES (A2:C2 merge) | Header PANES (D2:F2 merge) ──
        MergeSet(ws, 2, 1, 2, 3, "MEDALLONES (Linea Economica)", fs, bold: true, bg: CDorado);
        MergeSet(ws, 2, 4, 2, 6, "PANES",                        fs, bold: true, bg: CGris);

        // ── R03: Sub-header COMPLETA/MEDIA (A-C) | TRADICIONAL (D2:F2 merge) ──
        SetCell(ws, 3, 1, "",          fs, bg: CGris);
        SetCell(ws, 3, 2, "COMPLETA",  fs, bg: CGris);
        SetCell(ws, 3, 3, "MEDIA",     fs, bg: CGris);
        MergeSet(ws, 3, 4, 3, 6, "TRADICIONAL", fs, bold: true, bg: CDorado);

        // ── R04: 55 GR medallón | TRADICIONAL paquete 30 ──
        SetCell(ws, 4, 1, "55 GR", fs);
        SetTally(ws, 4, 2, t.Medallones.GetValueOrDefault(55).Completa, fs);
        SetTally(ws, 4, 3, t.Medallones.GetValueOrDefault(55).Media,    fs);
        SetCell(ws, 4, 4, "30", fs);
        SetTally(ws, 4, 5, GetPan(t.PanTradicional, 30), fs);

        // ── R05: 69 GR medallón | TRADICIONAL paquete 60 ──
        SetCell(ws, 5, 1, "69 GR", fs);
        SetTally(ws, 5, 2, t.Medallones.GetValueOrDefault(69).Completa, fs);
        SetTally(ws, 5, 3, t.Medallones.GetValueOrDefault(69).Media,    fs);
        SetCell(ws, 5, 4, "60", fs);
        SetTally(ws, 5, 5, GetPan(t.PanTradicional, 60), fs);

        // ── R06: 80 GR medallón ──
        SetCell(ws, 6, 1, "80 GR", fs);
        SetTally(ws, 6, 2, t.Medallones.GetValueOrDefault(80).Completa, fs);
        SetTally(ws, 6, 3, t.Medallones.GetValueOrDefault(80).Media,    fs);

        // ── R07: 110 GR medallón | Header MAXIHAMBURGUESA (D7:F7 merge) ──
        SetCell(ws, 7, 1, "110 GR", fs);
        SetTally(ws, 7, 2, t.Medallones.GetValueOrDefault(110).Completa, fs);
        SetTally(ws, 7, 3, t.Medallones.GetValueOrDefault(110).Media,    fs);
        MergeSet(ws, 7, 4, 7, 6, "MAXIHAMBURGUESA", fs, bold: true, bg: CVerde);

        // ── R08: (vacío izq) | MAXI paquete 20 ──
        SetCell(ws, 8, 4, "20", fs);
        SetTally(ws, 8, 5, GetPan(t.PanMaxi, 20), fs);

        // ── R09: (vacío izq) | MAXI paquete 40 ──
        SetCell(ws, 9, 4, "40", fs);
        SetTally(ws, 9, 5, GetPan(t.PanMaxi, 40), fs);

        // ── R10: Header HAMBURGUESAS Premium (A10:C10 merge) ──
        MergeSet(ws, 10, 1, 10, 3, "HAMBURGUESAS (Linea Premium)", fs, bold: true, bg: CVerde);

        // ── R11: Sub-header COMPLETA/MEDIA Premium ──
        SetCell(ws, 11, 1, "",         fs, bg: CGris);
        SetCell(ws, 11, 2, "COMPLETA", fs, bg: CGris);
        SetCell(ws, 11, 3, "MEDIA",    fs, bg: CGris);

        // ── R12: 80 GR Premium | Header PANCHO (D12:F12 merge) ──
        SetCell(ws, 12, 1, "80 GR", fs);
        SetTally(ws, 12, 2, t.Premium.GetValueOrDefault(80).Completa, fs);
        SetTally(ws, 12, 3, t.Premium.GetValueOrDefault(80).Media,    fs);
        MergeSet(ws, 12, 4, 12, 6, "PANCHO", fs, bold: true, bg: CAzulCielo);

        // ── R13: 110 GR Premium | PANCHO paquete 30 ──
        SetCell(ws, 13, 1, "110 GR", fs);
        SetTally(ws, 13, 2, t.Premium.GetValueOrDefault(110).Completa, fs);
        SetTally(ws, 13, 3, t.Premium.GetValueOrDefault(110).Media,    fs);
        SetCell(ws, 13, 4, "30", fs);
        SetTally(ws, 13, 5, GetPan(t.PanPancho, 30), fs);

        // ── R14: 120 GR Premium | PANCHO paquete 60 ──
        SetCell(ws, 14, 1, "120 GR", fs);
        SetTally(ws, 14, 2, t.Premium.GetValueOrDefault(120).Completa, fs);
        SetTally(ws, 14, 3, t.Premium.GetValueOrDefault(120).Media,    fs);
        SetCell(ws, 14, 4, "60", fs);
        SetTally(ws, 14, 5, GetPan(t.PanPancho, 60), fs);

        // ── R15: 160 GR Premium ──
        SetCell(ws, 15, 1, "160 GR", fs);
        SetTally(ws, 15, 2, t.Premium.GetValueOrDefault(160).Completa, fs);
        SetTally(ws, 15, 3, t.Premium.GetValueOrDefault(160).Media,    fs);

        // ── R16: 198 GR Premium | Header SUPERPANCHOS (D16:F16 merge) ──
        SetCell(ws, 16, 1, "198 GR", fs);
        SetTally(ws, 16, 2, t.Premium.GetValueOrDefault(198).Completa, fs);
        SetTally(ws, 16, 3, t.Premium.GetValueOrDefault(198).Media,    fs);
        MergeSet(ws, 16, 4, 16, 6, "SUPERPANCHOS", fs, bold: true, bg: CNaranja);

        // ── R17: (vacío izq) | SUPERPANCHO paquete 18 ──
        SetCell(ws, 17, 4, "18", fs);
        SetTally(ws, 17, 5, GetPan(t.PanSuperPancho, 18), fs);

        // ── R18: (vacío izq) | SUPERPANCHO paquete 36 ──
        SetCell(ws, 18, 4, "36", fs);
        SetTally(ws, 18, 5, GetPan(t.PanSuperPancho, 36), fs);

        // ── R19: Header SALCHICHAS CORTAS (A19:C19 merge) | SUPERPANCHO paquete 54 ──
        MergeSet(ws, 19, 1, 19, 3, "SALCHICHAS CORTAS", fs, bold: true, bg: CAzulCielo);
        SetCell(ws, 19, 4, "54", fs);
        SetTally(ws, 19, 5, GetPan(t.PanSuperPancho, 54), fs);

        // ── R20: SALCHICHAS CORTAS - 30 (media) | SUPERPANCHO paquete 60 ──
        SetCell(ws, 20, 1, "30", fs);
        SetTally(ws, 20, 2, t.SalchichaCorta.Media, fs);
        SetCell(ws, 20, 4, "60", fs);
        SetTally(ws, 20, 5, GetPan(t.PanSuperPancho, 60), fs);

        // ── R21: SALCHICHAS CORTAS - 60 (completa) ──
        SetCell(ws, 21, 1, "60", fs);
        SetTally(ws, 21, 2, t.SalchichaCorta.Completa, fs);

        // ── R22: Fila vacía separador ──

        // ── R23: Header SALCHICHAS LARGAS (A23:C23 merge) | Header ADEREZOS (D23:F23 merge) ──
        MergeSet(ws, 23, 1, 23, 3, "SALCHICHAS LARGAS", fs, bold: true, bg: CNaranja);
        MergeSet(ws, 23, 4, 23, 6, "ADEREZOS",          fs, bold: true, bg: CAmarillo);

        // ── R24: SALCHICHAS LARGAS - 18 | Aderezo 1 ──
        SetCell(ws, 24, 1, "18", fs);
        SetTally(ws, 24, 2, t.SalchichaLarga.Media, fs);  // media = 36, pero 18 es media de media
        var aderezos = t.Aderezos.OrderBy(x => x.Key).ToList();
        if (aderezos.Count >= 1)
        {
            SetCell(ws, 24, 4, aderezos[0].Key, fs);
            SetTally(ws, 24, 5, aderezos[0].Value, fs);
        }

        // ── R25: SALCHICHAS LARGAS - 36 (media) | Aderezo 2 (si existe) ──
        SetCell(ws, 25, 1, "36", fs);
        SetTally(ws, 25, 2, t.SalchichaLarga.Media, fs);
        if (aderezos.Count >= 2)
        {
            SetCell(ws, 25, 4, aderezos[1].Key, fs);
            SetTally(ws, 25, 5, aderezos[1].Value, fs);
        }

        // ── R26: SALCHICHAS LARGAS - 54 | Header SALSAS ──
        SetCell(ws, 26, 1, "54", fs);

        MergeSet(ws, 26, 4, 26, 6, "SALSAS", fs, bold: true, bg: CAmarillo);

        // ── R27: SALCHICHAS LARGAS - 60 (completa) ──
        SetCell(ws, 27, 1, "60", fs);
        SetTally(ws, 27, 2, t.SalchichaLarga.Completa, fs);

        // ── R28: Fila vacía separador ──

        // ── R29: OTROS - fila completa A-F con bg azul sólido y texto blanco ──
        for (var col = 1; col <= 6; col++)
        {
            ws.Cell(29, col).Style.Fill.BackgroundColor = CAzulSolido;
            ws.Cell(29, col).Style.Font.FontColor = XLColor.White;
            ws.Cell(29, col).Style.Font.FontSize = fs;
            ws.Cell(29, col).Style.Font.Bold = true;
        }
        ws.Cell(29, 3).Value = "OTROS";
        if (t.Otros > 0)
            ws.Cell(29, 4).Value = FormatPalotes(t.Otros);

        // ════════════════════════════════════════════════════════════════════
        // BORDES Y FORMATO VISUAL
        // ════════════════════════════════════════════════════════════════════

        // Bordes exteriores del rango completo A1:F29
        var rango = ws.Range("A1:F29");
        rango.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        rango.Style.Border.OutsideBorderColor = XLColor.Black;

        // ── Línea vertical gruesa separando carnes (A-C) de panes (D-F) ──
        for (var r = 1; r <= 29; r++)
        {
            ws.Cell(r, 3).Style.Border.RightBorder = XLBorderStyleValues.Medium;
            ws.Cell(r, 3).Style.Border.RightBorderColor = XLColor.Black;
        }

        // ── Líneas punteadas (dashed) separando secciones horizontalmente ──
        // Entre Medallones Eco y Premium (debajo de R7/R9 → en R9 bottom)
        AplicarLineaDashed(ws, 9);
        // Entre Premium y Salchichas Cortas (debajo de R17/R18 → en R18 bottom)
        AplicarLineaDashed(ws, 18);
        // Entre Salchichas Cortas y separador (debajo de R21)
        AplicarLineaDashed(ws, 21);
        // Entre separador y Salchichas Largas/Aderezos (debajo de R22)
        AplicarLineaDashed(ws, 22);
        // Entre contenido y OTROS (debajo de R28)
        AplicarLineaDashed(ws, 28);

        // ── Borde inferior grueso en filas de header de sección ──
        AplicarBordeInferiorGrueso(ws, 2);   // MEDALLONES header
        AplicarBordeInferiorGrueso(ws, 10);  // HAMBURGUESAS Premium header
        AplicarBordeInferiorGrueso(ws, 19);  // SALCHICHAS CORTAS header
        AplicarBordeInferiorGrueso(ws, 23);  // SALCHICHAS LARGAS / ADEREZOS header

        // ── Bordes delgados internos en las celdas de datos ──
        // Lado izquierdo (carnes): columnas A-C
        for (var r = 3; r <= 29; r++)
        {
            for (var c = 1; c <= 3; c++)
            {
                ws.Cell(r, c).Style.Border.TopBorder = XLBorderStyleValues.Hair;
                ws.Cell(r, c).Style.Border.TopBorderColor = XLColor.LightGray;
                ws.Cell(r, c).Style.Border.BottomBorder = XLBorderStyleValues.Hair;
                ws.Cell(r, c).Style.Border.BottomBorderColor = XLColor.LightGray;
            }
        }
        // Lado derecho (panes): columnas D-F
        for (var r = 3; r <= 29; r++)
        {
            for (var c = 4; c <= 6; c++)
            {
                ws.Cell(r, c).Style.Border.TopBorder = XLBorderStyleValues.Hair;
                ws.Cell(r, c).Style.Border.TopBorderColor = XLColor.LightGray;
                ws.Cell(r, c).Style.Border.BottomBorder = XLBorderStyleValues.Hair;
                ws.Cell(r, c).Style.Border.BottomBorderColor = XLColor.LightGray;
            }
        }

        // ── Fila R01 bordes completos ──
        for (var c = 1; c <= 6; c++)
        {
            ws.Cell(1, c).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            ws.Cell(1, c).Style.Border.BottomBorderColor = XLColor.Black;
            ws.Cell(1, c).Style.Border.TopBorder = XLBorderStyleValues.Thin;
            ws.Cell(1, c).Style.Border.TopBorderColor = XLColor.Black;
        }
    }

    // ─── Helpers de celda ────────────────────────────────────────────────────

    private static void SetCell(IXLWorksheet ws, int row, int col, string value, int fontSize,
        bool bold = false, XLColor? bg = null, XLColor? fontColor = null)
    {
        var cell = ws.Cell(row, col);
        cell.Value = value;
        cell.Style.Font.FontSize = fontSize;
        if (bold) cell.Style.Font.Bold = true;
        if (bg != null) cell.Style.Fill.BackgroundColor = bg;
        if (fontColor != null) cell.Style.Font.FontColor = fontColor;
    }

    /// <summary>
    /// Aplica merge de celdas, escribe valor y aplica color de fondo a todas las celdas del rango.
    /// </summary>
    private static void MergeSet(IXLWorksheet ws, int r1, int c1, int r2, int c2,
        string value, int fontSize, bool bold = false, XLColor? bg = null)
    {
        var rng = ws.Range(r1, c1, r2, c2);
        rng.Merge();
        if (bg != null) rng.Style.Fill.BackgroundColor = bg;
        var cell = ws.Cell(r1, c1);
        cell.Value = value;
        cell.Style.Font.FontSize = fontSize;
        if (bold) cell.Style.Font.Bold = true;
    }

    private static void SetTally(IXLWorksheet ws, int row, int col, int count, int fontSize)
    {
        if (count <= 0) return;
        ws.Cell(row, col).Value = FormatPalotes(count);
        ws.Cell(row, col).Style.Font.FontSize = fontSize;
    }

    /// <summary>
    /// Obtiene los palotes de una clave de panes; devuelve 0 si no existe.
    /// </summary>
    private static int GetPan(Dictionary<int, int> dict, int key)
        => dict.GetValueOrDefault(key);

    private static void AplicarBordeInferiorGrueso(IXLWorksheet ws, int fila)
    {
        for (var col = 1; col <= 6; col++)
        {
            ws.Cell(fila, col).Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            ws.Cell(fila, col).Style.Border.BottomBorderColor = XLColor.Black;
        }
    }

    /// <summary>
    /// Aplica una línea punteada (dashed) en el borde inferior de una fila completa (A-F).
    /// Estas líneas separan visualmente las secciones del Excel.
    /// </summary>
    private static void AplicarLineaDashed(IXLWorksheet ws, int fila)
    {
        for (var col = 1; col <= 6; col++)
        {
            ws.Cell(fila, col).Style.Border.BottomBorder = XLBorderStyleValues.Dashed;
            ws.Cell(fila, col).Style.Border.BottomBorderColor = XLColor.Black;
        }
    }

    private static string FormatPalotes(int count)
    {
        if (count <= 0) return "";
        var groups = count / 5;
        var remainder = count % 5;
        var parts = new List<string>();
        for (var i = 0; i < groups; i++)
            parts.Add("||||/");
        if (remainder > 0)
            parts.Add(new string('|', remainder));
        return string.Join(" ", parts);
    }

    #endregion
}
