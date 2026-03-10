namespace BurgerShop.Application.Logistica.DTOs;

public record UbicacionDto(int Id, int RepartidorId, double Latitud, double Longitud, DateTime FechaActualizacion, bool EstaActivo);
public record ActualizarUbicacionDto(double Latitud, double Longitud);
