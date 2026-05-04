namespace BurgerShop.Domain.Entities.Catalogo;

public class HistorialPrecio
{
    public int Id { get; set; }
    public string TipoEntidad { get; set; } = string.Empty;
    public int EntidadId { get; set; }
    public string? NombreEntidad { get; set; }
    public decimal PrecioAnterior { get; set; }
    public decimal PrecioNuevo { get; set; }
    public DateTime FechaCambio { get; set; } = DateTime.UtcNow;
    public string? UsuarioNombre { get; set; }
}
