using ClosedXML.Excel;

var path = args.Length > 0 ? args[0] : @"C:\Users\nestigarribia\Proyectos NET\ProyectoHLP\Control Camionetas.xlsx";
var wb = new XLWorkbook(path);

foreach (var ws in wb.Worksheets)
{
    Console.WriteLine($"=== HOJA: {ws.Name} ===");
    Console.WriteLine($"Cols: A={ws.Column(1).Width}, B={ws.Column(2).Width}, C={ws.Column(3).Width}, D={ws.Column(4).Width}, E={ws.Column(5).Width}, F={ws.Column(6).Width}");

    var range = ws.RangeUsed();
    if (range == null) { Console.WriteLine("(vacía)\n"); continue; }

    // Show merged ranges
    Console.WriteLine("Merged ranges:");
    foreach (var m in ws.MergedRanges)
        Console.WriteLine($"  {m.RangeAddress}");

    Console.WriteLine("\nCells with colors:");
    for (int r = range.FirstRow().RowNumber(); r <= range.LastRow().RowNumber(); r++)
    {
        for (int c = range.FirstColumn().ColumnNumber(); c <= range.LastColumn().ColumnNumber(); c++)
        {
            var cell = ws.Cell(r, c);
            var bg = cell.Style.Fill.BackgroundColor;
            var font = cell.Style.Font;
            var val = cell.GetFormattedString();
            if (!string.IsNullOrWhiteSpace(val) || cell.IsMerged())
            {
                var bgStr = bg.ColorType == XLColorType.Theme ? $"Theme:{bg.ThemeColor}" : bg.ColorType == XLColorType.Color ? $"#{bg.Color.R:X2}{bg.Color.G:X2}{bg.Color.B:X2}" : "none";
                var fontColor = font.FontColor.ColorType == XLColorType.Theme ? $"Theme:{font.FontColor.ThemeColor}" : font.FontColor.ColorType == XLColorType.Color ? $"#{font.FontColor.Color.R:X2}{font.FontColor.Color.G:X2}{font.FontColor.Color.B:X2}" : "default";
                if (bgStr != "none" || fontColor != "default" || font.Bold)
                    Console.WriteLine($"  {cell.Address}: bg={bgStr}, font={fontColor}, bold={font.Bold}, size={font.FontSize}, val='{val}'");
            }
        }
    }
    Console.WriteLine();
}
