namespace BurgerShop.Application.Logistica.DTOs;

public record MensajeDto(int Id, int RepartidorId, string Texto, bool EsDeAdmin, DateTime FechaEnvio, bool Leido);
public record CrearMensajeDto(int RepartidorId, string Texto);
