using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Interfaces.Ventas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Ventas.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _repo;
    private readonly ILogger<ClienteService> _logger;

    public ClienteService(IClienteRepository repo, ILogger<ClienteService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<ClienteDto>> GetAllAsync()
    {
        try
        {
            var clientes = await _repo.GetAllWithNavigationsAsync();
            return clientes.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllAsync), ex.Message);
            throw;
        }
    }

    public async Task<ClienteDto?> GetByIdAsync(int id)
    {
        try
        {
            var cliente = await _repo.GetByIdWithNavigationsAsync(id);
            return cliente is null ? null : MapToDto(cliente);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<ClienteDto>> BuscarAsync(string term)
    {
        try
        {
            var clientes = await _repo.BuscarAsync(term);
            return clientes.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(BuscarAsync), ex.Message);
            throw;
        }
    }

    public async Task<ClienteDto> CreateAsync(CrearClienteDto dto)
    {
        try
        {
            var cliente = new Cliente
            {
                Nombre = dto.Nombre,
                Cuit = dto.Cuit,
                Email = dto.Email,
                Telefono = dto.Telefono,
                Direccion = dto.Direccion,
                ZonaId = dto.ZonaId,
                TipoClienteId = dto.TipoClienteId,
                ListaPrecioId = dto.ListaPrecioId,
                LocalId = dto.LocalId,
                CondicionFiscal = dto.CondicionFiscal
            };

            await _repo.AddAsync(cliente);
            await _repo.SaveChangesAsync();

            // Recargar con navigations para retornar datos completos
            var creado = await _repo.GetByIdWithNavigationsAsync(cliente.Id);
            return MapToDto(creado!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(CreateAsync), ex.Message);
            throw;
        }
    }

    public async Task<ClienteDto?> UpdateAsync(int id, ActualizarClienteDto dto)
    {
        try
        {
            var cliente = await _repo.GetByIdAsync(id);
            if (cliente is null) return null;

            cliente.Nombre = dto.Nombre;
            cliente.Cuit = dto.Cuit;
            cliente.Email = dto.Email;
            cliente.Telefono = dto.Telefono;
            cliente.Direccion = dto.Direccion;
            cliente.ZonaId = dto.ZonaId;
            cliente.TipoClienteId = dto.TipoClienteId;
            cliente.ListaPrecioId = dto.ListaPrecioId;
            cliente.LocalId = dto.LocalId;
            cliente.CondicionFiscal = dto.CondicionFiscal;

            _repo.Update(cliente);
            await _repo.SaveChangesAsync();

            // Recargar con navigations para retornar datos completos
            var actualizado = await _repo.GetByIdWithNavigationsAsync(id);
            return MapToDto(actualizado!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(UpdateAsync), ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var cliente = await _repo.GetByIdAsync(id);
            if (cliente is null) return false;

            _repo.Remove(cliente);
            await _repo.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(DeleteAsync), ex.Message);
            throw;
        }
    }

    private static ClienteDto MapToDto(Cliente c) => new(
        c.Id,
        c.Nombre,
        c.Cuit,
        c.Email,
        c.Telefono,
        c.Direccion,
        c.ZonaId,
        c.Zona?.Nombre,
        c.TipoClienteId,
        c.TipoCliente?.Nombre,
        c.ListaPrecioId,
        c.ListaPrecio?.Nombre,
        c.LocalId,
        c.Local?.Nombre,
        c.CondicionFiscal);
}
