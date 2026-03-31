using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Interfaces;

namespace BurgerShop.Application.Inventario.Services;

public class EmpresaService : IEmpresaService
{
    private readonly IRepository<Empresa> _repo;

    public EmpresaService(IRepository<Empresa> repo) => _repo = repo;

    public async Task<IEnumerable<EmpresaDto>> GetAllAsync()
    {
        var empresas = await _repo.GetAllAsync();
        return empresas.Select(ToDto);
    }

    public async Task<EmpresaDto?> GetByIdAsync(int id)
    {
        var empresa = await _repo.GetByIdAsync(id);
        return empresa is null ? null : ToDto(empresa);
    }

    public async Task<EmpresaDto> CreateAsync(CrearEmpresaDto dto)
    {
        var empresa = new Empresa
        {
            RazonSocial = dto.RazonSocial,
            NombreFantasia = dto.NombreFantasia,
            Cuit = dto.Cuit,
            CondicionIva = dto.CondicionIva,
            DireccionFiscal = dto.DireccionFiscal,
            Localidad = dto.Localidad,
            Provincia = dto.Provincia,
            CodigoPostal = dto.CodigoPostal,
            Telefono = dto.Telefono,
            Email = dto.Email,
            LogoUrl = dto.LogoUrl,
            IngresosBrutos = dto.IngresosBrutos,
            InicioActividades = dto.InicioActividades,
            PuntoVenta = dto.PuntoVenta
        };
        await _repo.AddAsync(empresa);
        await _repo.SaveChangesAsync();
        return ToDto(empresa);
    }

    public async Task<EmpresaDto?> UpdateAsync(int id, ActualizarEmpresaDto dto)
    {
        var empresa = await _repo.GetByIdAsync(id);
        if (empresa is null) return null;

        empresa.RazonSocial = dto.RazonSocial;
        empresa.NombreFantasia = dto.NombreFantasia;
        empresa.Cuit = dto.Cuit;
        empresa.CondicionIva = dto.CondicionIva;
        empresa.DireccionFiscal = dto.DireccionFiscal;
        empresa.Localidad = dto.Localidad;
        empresa.Provincia = dto.Provincia;
        empresa.CodigoPostal = dto.CodigoPostal;
        empresa.Telefono = dto.Telefono;
        empresa.Email = dto.Email;
        empresa.LogoUrl = dto.LogoUrl;
        empresa.IngresosBrutos = dto.IngresosBrutos;
        empresa.InicioActividades = dto.InicioActividades;
        empresa.PuntoVenta = dto.PuntoVenta;
        empresa.Activa = dto.Activa;

        _repo.Update(empresa);
        await _repo.SaveChangesAsync();
        return ToDto(empresa);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var empresa = await _repo.GetByIdAsync(id);
        if (empresa is null) return false;
        empresa.Activa = false;
        _repo.Update(empresa);
        await _repo.SaveChangesAsync();
        return true;
    }

    private static EmpresaDto ToDto(Empresa e) => new(
        e.Id, e.RazonSocial, e.NombreFantasia, e.Cuit, e.CondicionIva,
        e.DireccionFiscal, e.Localidad, e.Provincia, e.CodigoPostal,
        e.Telefono, e.Email, e.LogoUrl, e.IngresosBrutos,
        e.InicioActividades, e.PuntoVenta, e.Activa);
}
