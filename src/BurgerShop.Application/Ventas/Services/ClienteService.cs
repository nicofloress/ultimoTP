using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces.Ventas;

namespace BurgerShop.Application.Ventas.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _repo;

    public ClienteService(IClienteRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<ClienteDto>> GetAllAsync()
    {
        var clientes = await _repo.GetAllWithNavigationsAsync();
        return clientes.Select(MapToDto);
    }

    public async Task<ClienteDto?> GetByIdAsync(int id)
    {
        var cliente = await _repo.GetByIdWithNavigationsAsync(id);
        return cliente is null ? null : MapToDto(cliente);
    }

    public async Task<IEnumerable<ClienteDto>> BuscarAsync(string term)
    {
        var clientes = await _repo.BuscarAsync(term);
        return clientes.Select(MapToDto);
    }

    public async Task<ClienteDto> CreateAsync(CrearClienteDto dto)
    {
        var cliente = new Cliente
        {
            Nombre = dto.Nombre,
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            ZonaId = dto.ZonaId,
            TipoClienteId = dto.TipoClienteId
        };

        await _repo.AddAsync(cliente);
        await _repo.SaveChangesAsync();

        // Recargar con navigations para retornar datos completos
        var creado = await _repo.GetByIdWithNavigationsAsync(cliente.Id);
        return MapToDto(creado!);
    }

    public async Task<ClienteDto?> UpdateAsync(int id, ActualizarClienteDto dto)
    {
        var cliente = await _repo.GetByIdAsync(id);
        if (cliente is null) return null;

        cliente.Nombre = dto.Nombre;
        cliente.Telefono = dto.Telefono;
        cliente.Direccion = dto.Direccion;
        cliente.ZonaId = dto.ZonaId;
        cliente.TipoClienteId = dto.TipoClienteId;

        _repo.Update(cliente);
        await _repo.SaveChangesAsync();

        // Recargar con navigations para retornar datos completos
        var actualizado = await _repo.GetByIdWithNavigationsAsync(id);
        return MapToDto(actualizado!);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var cliente = await _repo.GetByIdAsync(id);
        if (cliente is null) return false;

        _repo.Remove(cliente);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static ClienteDto MapToDto(Cliente c) => new(
        c.Id,
        c.Nombre,
        c.Telefono,
        c.Direccion,
        c.ZonaId,
        c.Zona?.Nombre,
        c.TipoClienteId,
        c.TipoCliente?.Nombre);
}
