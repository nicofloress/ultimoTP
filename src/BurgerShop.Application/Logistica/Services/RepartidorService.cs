using BurgerShop.Application.Logistica.DTOs;
using BurgerShop.Application.Logistica.Interfaces;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Interfaces.Logistica;

namespace BurgerShop.Application.Logistica.Services;

public class RepartidorService : IRepartidorService
{
    private readonly IRepartidorRepository _repo;

    public RepartidorService(IRepartidorRepository repo) => _repo = repo;

    public async Task<IEnumerable<RepartidorDto>> GetAllAsync()
    {
        var repartidores = await _repo.GetAllAsync();
        return repartidores.Select(ToDto);
    }

    public async Task<IEnumerable<RepartidorDto>> GetActivosAsync()
    {
        var repartidores = await _repo.GetActivosAsync();
        return repartidores.Select(ToDto);
    }

    public async Task<RepartidorDto?> GetByIdAsync(int id)
    {
        var r = await _repo.GetByIdWithZonasAsync(id);
        return r is null ? null : ToDto(r);
    }

    public async Task<RepartidorDto> CreateAsync(CrearRepartidorDto dto)
    {
        var repartidor = new Repartidor
        {
            Nombre = dto.Nombre,
            Telefono = dto.Telefono,
            Vehiculo = dto.Vehiculo,
            CodigoAcceso = dto.CodigoAcceso
        };
        await _repo.AddAsync(repartidor);
        await _repo.SaveChangesAsync();
        return ToDto(repartidor);
    }

    public async Task<RepartidorDto?> UpdateAsync(int id, ActualizarRepartidorDto dto)
    {
        var repartidor = await _repo.GetByIdWithZonasAsync(id);
        if (repartidor is null) return null;

        repartidor.Nombre = dto.Nombre;
        repartidor.Telefono = dto.Telefono;
        repartidor.Vehiculo = dto.Vehiculo;
        repartidor.Activo = dto.Activo;
        if (!string.IsNullOrWhiteSpace(dto.CodigoAcceso))
            repartidor.CodigoAcceso = dto.CodigoAcceso;

        _repo.Update(repartidor);
        await _repo.SaveChangesAsync();
        return ToDto(repartidor);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var repartidor = await _repo.GetByIdAsync(id);
        if (repartidor is null) return false;

        repartidor.Activo = false;
        _repo.Update(repartidor);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<RepartidorDto?> AsignarZonasAsync(int id, List<int> zonaIds)
    {
        var repartidor = await _repo.GetByIdWithZonasAsync(id);
        if (repartidor is null) return null;

        repartidor.RepartidorZonas.Clear();
        foreach (var zonaId in zonaIds)
        {
            repartidor.RepartidorZonas.Add(new RepartidorZona { RepartidorId = id, ZonaId = zonaId });
        }

        _repo.Update(repartidor);
        await _repo.SaveChangesAsync();

        var updated = await _repo.GetByIdWithZonasAsync(id);
        return ToDto(updated!);
    }

    public async Task<RepartidorLoginResultDto?> LoginAsync(string codigoAcceso)
    {
        var repartidor = await _repo.GetByCodigoAccesoAsync(codigoAcceso);
        if (repartidor is null) return null;
        return new RepartidorLoginResultDto(repartidor.Id, repartidor.Nombre);
    }

    private static RepartidorDto ToDto(Repartidor r) => new(
        r.Id, r.Nombre, r.Telefono, r.Vehiculo, r.Activo,
        r.RepartidorZonas?.Select(rz => new ZonaDto(
            rz.Zona?.Id ?? rz.ZonaId,
            rz.Zona?.Nombre ?? "",
            rz.Zona?.Descripcion,
            rz.Zona?.CostoEnvio ?? 0,
            rz.Zona?.Activa ?? true
        )).ToList() ?? new List<ZonaDto>());
}
