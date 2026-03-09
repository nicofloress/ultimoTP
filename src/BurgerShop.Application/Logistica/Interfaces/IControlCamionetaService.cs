namespace BurgerShop.Application.Logistica.Interfaces;

public interface IControlCamionetaService
{
    Task<byte[]> GenerarExcelAsync(IEnumerable<(int ZonaId, int RepartidorId)> asignaciones);
}
