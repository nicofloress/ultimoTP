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
        // Carnes: PesoGramos → cantidad de palotes
        public Dictionary<int, int> Medallones { get; } = new() { [55] = 0, [69] = 0, [80] = 0, [110] = 0 };
        public Dictionary<int, int> Premium { get; } = new() { [69] = 0, [80] = 0, [110] = 0, [120] = 0, [160] = 0, [198] = 0 };
        // Salchichas: UnidadesPorBulto → palotes
        public Dictionary<int, int> SalchichaCorta { get; } = new() { [30] = 0, [60] = 0 };
        public Dictionary<int, int> SalchichaLarga { get; } = new() { [18] = 0, [36] = 0, [54] = 0, [60] = 0 };
        // Panes: UnidadesPorBulto → palotes
        public Dictionary<int, int> PanTradicional { get; } = new() { [30] = 0, [60] = 0 };
        public Dictionary<int, int> PanMaxi { get; } = new() { [20] = 0, [40] = 0 };
        public Dictionary<int, int> PanPancho { get; } = new() { [30] = 0, [60] = 0 };
        public Dictionary<int, int> PanSuperPancho { get; } = new() { [18] = 0, [36] = 0, [54] = 0, [60] = 0 };
        // Aderezos: nombre upper → palotes
        public Dictionary<string, int> Aderezos { get; } = new() { ["MAYONESA"] = 0, ["MOSTAZA"] = 0 };
        public Dictionary<string, int> Salsas { get; } = new();
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
        var seccion = producto.Categoria?.SeccionCamioneta ?? SeccionCamioneta.Otro;
        var peso = producto.PesoGramos ?? 0;
        var bulto = producto.UnidadesPorBulto;

        switch (seccion)
        {
            case SeccionCamioneta.MedallonEconomico:
                TallyIfExists(data.Medallones, peso, cantidad);
                // Carnes implican panes: ≤80g → Tradicional, ≥110g → Maxi
                if (peso <= 80)
                    TallyIfExists(data.PanTradicional, bulto, cantidad);
                else
                    TallyIfExists(data.PanMaxi, bulto, cantidad);
                break;

            case SeccionCamioneta.HamburguesaPremium:
                TallyIfExists(data.Premium, peso, cantidad);
                if (peso <= 80)
                    TallyIfExists(data.PanTradicional, bulto, cantidad);
                else
                    TallyIfExists(data.PanMaxi, bulto, cantidad);
                break;

            case SeccionCamioneta.SalchichaCorta:
                TallyIfExists(data.SalchichaCorta, bulto, cantidad);
                TallyIfExists(data.PanPancho, bulto, cantidad);
                break;

            case SeccionCamioneta.SalchichaLarga:
                TallyIfExists(data.SalchichaLarga, bulto, cantidad);
                TallyIfExists(data.PanSuperPancho, bulto, cantidad);
                break;

            case SeccionCamioneta.PanTradicional:
                TallyIfExists(data.PanTradicional, bulto, cantidad);
                break;

            case SeccionCamioneta.PanMaxi:
                TallyIfExists(data.PanMaxi, bulto, cantidad);
                break;

            case SeccionCamioneta.PanPancho:
                TallyIfExists(data.PanPancho, bulto, cantidad);
                break;

            case SeccionCamioneta.PanSuperPancho:
                TallyIfExists(data.PanSuperPancho, bulto, cantidad);
                break;

            case SeccionCamioneta.Aderezo:
                var nombre = producto.Nombre.ToUpperInvariant();
                if (data.Aderezos.ContainsKey(nombre))
                    data.Aderezos[nombre] += cantidad;
                else
                    data.Salsas[nombre] = data.Salsas.GetValueOrDefault(nombre) + cantidad;
                break;

            default:
                data.Otros += cantidad;
                break;
        }
    }

    private static void TallyIfExists(Dictionary<int, int> dict, int key, int cantidad)
    {
        if (dict.ContainsKey(key))
            dict[key] += cantidad;
    }

    #endregion

    #region Excel Generation — Template fijo idéntico al original

    // Colores aproximados a los Theme del Excel original
    private static readonly XLColor Accent1 = XLColor.FromHtml("#4472C4");   // Azul (header labels)
    private static readonly XLColor Accent2 = XLColor.FromHtml("#ED7D31");   // Naranja (Salch.Largas, SuperPanchos)
    private static readonly XLColor Accent4 = XLColor.FromHtml("#FFC000");   // Dorado (Medallones, Tradicional)
    private static readonly XLColor Accent5 = XLColor.FromHtml("#5B9BD5");   // Azul claro (Salch.Cortas, Pancho, Otros)
    private static readonly XLColor Accent6 = XLColor.FromHtml("#70AD47");   // Verde (Premium, MaxiHamburguesa)
    private static readonly XLColor Bg2 = XLColor.FromHtml("#E7E6E6");       // Gris claro (COMPLETA/MEDIA)
    private static readonly XLColor Yellow = XLColor.FromHtml("#FFFF00");    // Amarillo (Aderezos, Salsas)

    private void GenerarHoja(XLWorkbook workbook, string repartidor, string? vehiculo, TallyData t)
    {
        var sheetName = repartidor.Length > 31 ? repartidor[..31] : repartidor;
        var ws = workbook.Worksheets.Add(sheetName);

        // Anchos de columna (igual al original)
        ws.Column(1).Width = 15; ws.Column(2).Width = 15; ws.Column(3).Width = 15;
        ws.Column(4).Width = 14.5; ws.Column(5).Width = 12; ws.Column(6).Width = 14;

        var fontSize = 14;

        // ── R1: Header ──
        SetCell(ws, 1, 1, "REPARTIDOR", 11, true, Accent1);
        SetCell(ws, 1, 2, repartidor, 11);
        SetCell(ws, 1, 3, "CAMIONETA", 11, true, Accent1);
        SetCell(ws, 1, 4, vehiculo ?? "-", 11);
        SetCell(ws, 1, 5, "FECHA", 11, true, Accent1);
        SetCell(ws, 1, 6, DateTime.Today.ToString("M/d/yyyy"), 11);

        // ── R2: Secciones principales ──
        var mergeLeft = ws.Range("A2:C2"); mergeLeft.Merge();
        SetCell(ws, 2, 1, "MEDALLONES (Linea Economica)", fontSize, true, Accent4);
        ws.Cell(2, 2).Style.Fill.BackgroundColor = Accent4;
        ws.Cell(2, 3).Style.Fill.BackgroundColor = Accent4;

        var mergeRight = ws.Range("D2:F2"); mergeRight.Merge();
        SetCell(ws, 2, 4, "PANES", fontSize, true, Bg2);
        ws.Cell(2, 5).Style.Fill.BackgroundColor = Bg2;
        ws.Cell(2, 6).Style.Fill.BackgroundColor = Bg2;

        // ── R3: Sub-headers ──
        SetCell(ws, 3, 2, "COMPLETA", fontSize, false, Bg2);
        SetCell(ws, 3, 3, "MEDIA", fontSize, false, Bg2);
        SetCell(ws, 3, 4, "TRADICIONAL", fontSize, true, Accent4);

        // ── R4-R7: Medallones por peso ──
        SetCell(ws, 4, 1, "55 GR", fontSize); SetTally(ws, 4, 2, t.Medallones[55], fontSize);
        SetCell(ws, 5, 1, "69 GR", fontSize); SetTally(ws, 5, 2, t.Medallones[69], fontSize);
        SetCell(ws, 6, 1, "80 GR", fontSize); SetTally(ws, 6, 2, t.Medallones[80], fontSize);
        SetCell(ws, 7, 1, "110 GR", fontSize); SetTally(ws, 7, 2, t.Medallones[110], fontSize);

        // ── R4-R5: Panes Tradicional ──
        SetCell(ws, 4, 4, "30", fontSize); SetTally(ws, 4, 5, t.PanTradicional[30], fontSize);
        SetCell(ws, 5, 4, "60", fontSize); SetTally(ws, 5, 5, t.PanTradicional[60], fontSize);

        // ── R7: Panes MaxiHamburguesa header ──
        SetCell(ws, 7, 4, "MAXIHAMBURGUESA", fontSize, true, Accent6);

        // ── R8-R9: Panes Maxi ──
        SetCell(ws, 8, 4, "20", fontSize); SetTally(ws, 8, 5, t.PanMaxi[20], fontSize);
        SetCell(ws, 9, 4, "40", fontSize); SetTally(ws, 9, 5, t.PanMaxi[40], fontSize);

        // ── R10: Hamburguesas Premium header ──
        var mergePremium = ws.Range("A10:C10"); mergePremium.Merge();
        SetCell(ws, 10, 1, "HAMBURGUESAS (Linea Premium)", fontSize, true, Accent6);
        ws.Cell(10, 2).Style.Fill.BackgroundColor = Accent6;
        ws.Cell(10, 3).Style.Fill.BackgroundColor = Accent6;

        // ── R11: Sub-headers ──
        SetCell(ws, 11, 2, "COMPLETA", fontSize, false, Bg2);
        SetCell(ws, 11, 3, "MEDIA", fontSize, false, Bg2);

        // ── R12-R17: Premium por peso ──
        SetCell(ws, 12, 1, "69 GR", fontSize); SetTally(ws, 12, 2, t.Premium[69], fontSize);
        SetCell(ws, 13, 1, "80 GR", fontSize); SetTally(ws, 13, 2, t.Premium[80], fontSize);
        SetCell(ws, 14, 1, "110 GR", fontSize); SetTally(ws, 14, 2, t.Premium[110], fontSize);
        SetCell(ws, 15, 1, "120 GR", fontSize); SetTally(ws, 15, 2, t.Premium[120], fontSize);
        SetCell(ws, 16, 1, "160 GR", fontSize); SetTally(ws, 16, 2, t.Premium[160], fontSize);
        SetCell(ws, 17, 1, "198 GR", fontSize); SetTally(ws, 17, 2, t.Premium[198], fontSize);

        // ── R12: Panes Pancho header ──
        SetCell(ws, 12, 4, "PANCHO", fontSize, true, Accent5);

        // ── R13-R14: Panes Pancho ──
        SetCell(ws, 13, 4, "30", fontSize); SetTally(ws, 13, 5, t.PanPancho[30], fontSize);
        SetCell(ws, 14, 4, "60", fontSize); SetTally(ws, 14, 5, t.PanPancho[60], fontSize);

        // ── R16: Panes SuperPanchos header ──
        SetCell(ws, 16, 4, "SUPERPANCHOS", fontSize, true, Accent2);

        // ── R17-R20: Panes SuperPancho ──
        SetCell(ws, 17, 4, "18", fontSize); SetTally(ws, 17, 5, t.PanSuperPancho[18], fontSize);
        SetCell(ws, 18, 4, "36", fontSize); SetTally(ws, 18, 5, t.PanSuperPancho[36], fontSize);
        SetCell(ws, 19, 4, "54", fontSize); SetTally(ws, 19, 5, t.PanSuperPancho[54], fontSize);
        SetCell(ws, 20, 4, "60", fontSize); SetTally(ws, 20, 5, t.PanSuperPancho[60], fontSize);

        // ── R19: Salchichas Cortas header ──
        SetCell(ws, 19, 1, "SALCHICHAS CORTAS", fontSize, true, Accent5);

        // ── R20-R21: Salchichas Cortas ──
        SetCell(ws, 20, 1, "30", fontSize); SetTally(ws, 20, 2, t.SalchichaCorta[30], fontSize);
        SetCell(ws, 21, 1, "60", fontSize); SetTally(ws, 21, 2, t.SalchichaCorta[60], fontSize);

        // ── R23: Salchichas Largas header + Aderezos header ──
        SetCell(ws, 23, 1, "SALCHICHAS LARGAS", fontSize, true, Accent2);
        SetCell(ws, 23, 4, "ADEREZOS", fontSize, true, Yellow);

        // ── R24-R27: Salchichas Largas ──
        SetCell(ws, 24, 1, "18", fontSize); SetTally(ws, 24, 2, t.SalchichaLarga[18], fontSize);
        SetCell(ws, 25, 1, "36", fontSize); SetTally(ws, 25, 2, t.SalchichaLarga[36], fontSize);
        SetCell(ws, 26, 1, "54", fontSize); SetTally(ws, 26, 2, t.SalchichaLarga[54], fontSize);
        SetCell(ws, 27, 1, "60", fontSize); SetTally(ws, 27, 2, t.SalchichaLarga[60], fontSize);

        // ── R24-R25: Aderezos ──
        SetCell(ws, 24, 4, "MAYONESA", fontSize); SetTally(ws, 24, 5, t.Aderezos["MAYONESA"], fontSize);
        SetCell(ws, 25, 4, "MOSTAZA", fontSize); SetTally(ws, 25, 5, t.Aderezos["MOSTAZA"], fontSize);

        // ── R26: Salsas header ──
        SetCell(ws, 26, 4, "SALSAS", fontSize, true, Yellow);

        // ── R26+: Salsas dinámicas
        var filaSalsa = 27;
        foreach (var (nombre, count) in t.Salsas)
        {
            SetCell(ws, filaSalsa, 4, nombre, fontSize); SetTally(ws, filaSalsa, 5, count, fontSize);
            filaSalsa++;
        }

        // ── R29: Otros ──
        SetCell(ws, 29, 3, "OTROS", fontSize, true, Accent5);
        if (t.Otros > 0)
            SetTally(ws, 29, 4, t.Otros, fontSize);
    }

    private static void SetCell(IXLWorksheet ws, int row, int col, string value, int fontSize,
        bool bold = false, XLColor? bgColor = null)
    {
        var cell = ws.Cell(row, col);
        cell.Value = value;
        cell.Style.Font.FontSize = fontSize;
        if (bold) cell.Style.Font.Bold = true;
        if (bgColor != null) cell.Style.Fill.BackgroundColor = bgColor;
    }

    private static void SetTally(IXLWorksheet ws, int row, int col, int count, int fontSize)
    {
        if (count <= 0) return;
        ws.Cell(row, col).Value = FormatPalotes(count);
        ws.Cell(row, col).Style.Font.FontSize = fontSize;
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
