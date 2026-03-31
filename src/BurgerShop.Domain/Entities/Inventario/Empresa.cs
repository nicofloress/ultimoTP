namespace BurgerShop.Domain.Entities.Inventario;

public class Empresa
{
    public int Id { get; set; }
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreFantasia { get; set; }
    public string Cuit { get; set; } = string.Empty;
    public string CondicionIva { get; set; } = string.Empty; // Responsable Inscripto, Monotributista, Exento, etc.
    public string? DireccionFiscal { get; set; }
    public string? Localidad { get; set; }
    public string? Provincia { get; set; }
    public string? CodigoPostal { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? LogoUrl { get; set; }
    public string? IngresosBrutos { get; set; }
    public DateTime? InicioActividades { get; set; }
    public int? PuntoVenta { get; set; } // Punto de venta AFIP para facturación
    public bool Activa { get; set; } = true;

    public ICollection<Local> Locales { get; set; } = new List<Local>();
}
