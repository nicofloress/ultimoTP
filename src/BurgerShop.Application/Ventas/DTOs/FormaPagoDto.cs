namespace BurgerShop.Application.Ventas.DTOs;

public record FormaPagoDto(
    int Id,
    string Nombre,
    decimal PorcentajeRecargo,
    bool Activa);

public record CrearFormaPagoDto(
    string Nombre,
    decimal PorcentajeRecargo,
    bool Activa);

public record ActualizarFormaPagoDto(
    string Nombre,
    decimal PorcentajeRecargo,
    bool Activa);
