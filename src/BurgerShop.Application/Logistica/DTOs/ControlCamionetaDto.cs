namespace BurgerShop.Application.Logistica.DTOs;

public class ControlCamionetaDto
{
    public List<RepartidorTallyDto> Repartidores { get; set; } = new();
}

public class RepartidorTallyDto
{
    public int RepartidorId { get; set; }
    public string Nombre { get; set; } = "";
    public string? Vehiculo { get; set; }
    public string Fecha { get; set; } = "";
    public int TotalPedidos { get; set; }

    // Medallones Eco: key = peso (55, 69, 80, 110), value = {Completa, Media}
    public Dictionary<string, CompletaMediaDto> Medallones { get; set; } = new();
    // Premium: key = peso (80, 110, 120, 160, 198)
    public Dictionary<string, CompletaMediaDto> Premium { get; set; } = new();

    public CompletaMediaDto SalchichaCorta { get; set; } = new();
    public CompletaMediaDto SalchichaLarga { get; set; } = new();

    // Panes: key = qty (30, 60, etc.), value = palotes count
    public Dictionary<string, int> PanTradicional { get; set; } = new();
    public Dictionary<string, int> PanMaxi { get; set; } = new();
    public Dictionary<string, int> PanPancho { get; set; } = new();
    public Dictionary<string, int> PanSuperPancho { get; set; } = new();

    // Aderezos: key = nombre, value = cantidad
    public Dictionary<string, int> Aderezos { get; set; } = new();

    public Dictionary<string, int> Otros { get; set; } = new();

    /// <summary>
    /// True si todos los pedidos del repartidor son terminales (Entregado/Cancelado/NoEntregado).
    /// </summary>
    public bool Finalizado { get; set; }
}

public class CompletaMediaDto
{
    public int Completa { get; set; }
    public int Media { get; set; }
    public int Sueltos { get; set; }
}
