namespace BurgerShop.Application.Ventas.DTOs;

public class TipoClienteDto
{
    public int     Id                     { get; set; }
    public string  Nombre                 { get; set; } = string.Empty;
    public string? Descripcion            { get; set; }
    public int?    ListaPrecioId          { get; set; }
    public bool    Activo                 { get; set; }
    public bool    PermiteCuentaCorriente { get; set; }
}

public class CrearTipoClienteDto
{
    public string  Nombre                 { get; set; } = string.Empty;
    public string? Descripcion            { get; set; }
    public int?    ListaPrecioId          { get; set; }
    public bool    PermiteCuentaCorriente { get; set; } = false;
}

public class ActualizarTipoClienteDto
{
    public string  Nombre                 { get; set; } = string.Empty;
    public string? Descripcion            { get; set; }
    public int?    ListaPrecioId          { get; set; }
    public bool    PermiteCuentaCorriente { get; set; } = false;
}
