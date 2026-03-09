namespace BurgerShop.Application.Ventas.DTOs;

public class TipoClienteDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
}

public class CrearTipoClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class ActualizarTipoClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
