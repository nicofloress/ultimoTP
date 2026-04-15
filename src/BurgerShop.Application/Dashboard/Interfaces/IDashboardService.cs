using BurgerShop.Application.Dashboard.DTOs;

namespace BurgerShop.Application.Dashboard.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int? localId, bool incluirComparativa);
}
