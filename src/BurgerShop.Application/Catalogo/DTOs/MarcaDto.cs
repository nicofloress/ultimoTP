namespace BurgerShop.Application.Catalogo.DTOs;

public class MarcaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? ProveedorId { get; set; }
    public string? ProveedorNombre { get; set; }
    public bool Activo { get; set; }
}

public class CrearMarcaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? ProveedorId { get; set; }
}

public class ActualizarMarcaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? ProveedorId { get; set; }
    public bool Activo { get; set; }
}
