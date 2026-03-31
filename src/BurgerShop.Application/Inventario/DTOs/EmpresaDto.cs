namespace BurgerShop.Application.Inventario.DTOs;

public record EmpresaDto(
    int Id,
    string RazonSocial,
    string? NombreFantasia,
    string Cuit,
    string CondicionIva,
    string? DireccionFiscal,
    string? Localidad,
    string? Provincia,
    string? CodigoPostal,
    string? Telefono,
    string? Email,
    string? LogoUrl,
    string? IngresosBrutos,
    DateTime? InicioActividades,
    int? PuntoVenta,
    bool Activa);

public record CrearEmpresaDto(
    string RazonSocial,
    string? NombreFantasia,
    string Cuit,
    string CondicionIva,
    string? DireccionFiscal,
    string? Localidad,
    string? Provincia,
    string? CodigoPostal,
    string? Telefono,
    string? Email,
    string? LogoUrl,
    string? IngresosBrutos,
    DateTime? InicioActividades,
    int? PuntoVenta);

public record ActualizarEmpresaDto(
    string RazonSocial,
    string? NombreFantasia,
    string Cuit,
    string CondicionIva,
    string? DireccionFiscal,
    string? Localidad,
    string? Provincia,
    string? CodigoPostal,
    string? Telefono,
    string? Email,
    string? LogoUrl,
    string? IngresosBrutos,
    DateTime? InicioActividades,
    int? PuntoVenta,
    bool Activa);
