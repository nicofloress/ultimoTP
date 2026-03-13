using BurgerShop.Application.Catalogo.DTOs;
using BurgerShop.Application.Catalogo.Interfaces;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Interfaces.Catalogo;

namespace BurgerShop.Application.Catalogo.Services;

public class ProductoService : IProductoService
{
    private readonly IProductoRepository _repo;
    private readonly IListaPrecioRepository _listaPrecioRepo;

    public ProductoService(IProductoRepository repo, IListaPrecioRepository listaPrecioRepo)
    {
        _repo = repo;
        _listaPrecioRepo = listaPrecioRepo;
    }

    public async Task<IEnumerable<ProductoDto>> GetAllAsync()
    {
        var productos = await _repo.GetActivosAsync();
        return productos.Select(ToDto);
    }

    public async Task<IEnumerable<ProductoDto>> GetActivosAsync(int? listaPrecioId = null)
    {
        var productos = await _repo.GetActivosAsync();

        if (!listaPrecioId.HasValue)
            return productos.Select(ToDto);

        var precios = await ObtenerPreciosPorListaAsync(listaPrecioId.Value, productos.Select(p => p.Id));
        return productos.Select(p => ToDtoConPrecioLista(p, precios));
    }

    public async Task<IEnumerable<ProductoDto>> GetByCategoriaAsync(int categoriaId, int? listaPrecioId = null)
    {
        var productos = await _repo.GetByCategoriaAsync(categoriaId);

        if (!listaPrecioId.HasValue)
            return productos.Select(ToDto);

        var precios = await ObtenerPreciosPorListaAsync(listaPrecioId.Value, productos.Select(p => p.Id));
        return productos.Select(p => ToDtoConPrecioLista(p, precios));
    }

    public async Task<ProductoDto?> GetByIdAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p is null) return null;
        var cat = p.Categoria;
        return new ProductoDto(p.Id, p.Nombre, p.Descripcion, p.Precio, p.CategoriaId, cat?.Nombre ?? "", p.Activo, p.ImagenUrl, p.NumeroInterno, p.PesoGramos, p.UnidadesPorBulto, null, p.Marca, p.UnidadesPorMedia);
    }

    public async Task<ProductoDto> CreateAsync(CrearProductoDto dto)
    {
        var producto = new Producto
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
            CategoriaId = dto.CategoriaId,
            ImagenUrl = dto.ImagenUrl,
            NumeroInterno = dto.NumeroInterno,
            PesoGramos = dto.PesoGramos,
            UnidadesPorBulto = dto.UnidadesPorBulto,
            Marca = dto.Marca,
            UnidadesPorMedia = dto.UnidadesPorMedia
        };
        await _repo.AddAsync(producto);
        await _repo.SaveChangesAsync();
        return new ProductoDto(producto.Id, producto.Nombre, producto.Descripcion, producto.Precio, producto.CategoriaId, "", producto.Activo, producto.ImagenUrl, producto.NumeroInterno, producto.PesoGramos, producto.UnidadesPorBulto, null, producto.Marca, producto.UnidadesPorMedia);
    }

    public async Task<ProductoDto?> UpdateAsync(int id, ActualizarProductoDto dto)
    {
        var producto = await _repo.GetByIdAsync(id);
        if (producto is null) return null;

        producto.Nombre = dto.Nombre;
        producto.Descripcion = dto.Descripcion;
        producto.Precio = dto.Precio;
        producto.CategoriaId = dto.CategoriaId;
        producto.Activo = dto.Activo;
        producto.ImagenUrl = dto.ImagenUrl;
        producto.NumeroInterno = dto.NumeroInterno;
        producto.PesoGramos = dto.PesoGramos;
        producto.UnidadesPorBulto = dto.UnidadesPorBulto;
        producto.Marca = dto.Marca;
        producto.UnidadesPorMedia = dto.UnidadesPorMedia;
        _repo.Update(producto);
        await _repo.SaveChangesAsync();
        return new ProductoDto(producto.Id, producto.Nombre, producto.Descripcion, producto.Precio, producto.CategoriaId, "", producto.Activo, producto.ImagenUrl, producto.NumeroInterno, producto.PesoGramos, producto.UnidadesPorBulto, null, producto.Marca, producto.UnidadesPorMedia);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var producto = await _repo.GetByIdAsync(id);
        if (producto is null) return false;

        producto.Activo = false;
        _repo.Update(producto);
        await _repo.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ProductoDto>> BuscarAsync(string termino, int? listaPrecioId = null)
    {
        var productos = await _repo.GetActivosAsync();
        var terminoLower = termino.ToLowerInvariant();
        var filtrados = productos
            .Where(p => (p.NumeroInterno != null && p.NumeroInterno.ToLowerInvariant().Contains(terminoLower))
                     || p.Nombre.ToLowerInvariant().Contains(terminoLower)
                     || (p.Descripcion != null && p.Descripcion.ToLowerInvariant().Contains(terminoLower))
                     || (p.Marca != null && p.Marca.ToLowerInvariant().Contains(terminoLower)))
            .ToList();

        if (!listaPrecioId.HasValue)
            return filtrados.Select(ToDto);

        var precios = await ObtenerPreciosPorListaAsync(listaPrecioId.Value, filtrados.Select(p => p.Id));
        return filtrados.Select(p => ToDtoConPrecioLista(p, precios));
    }

    private async Task<Dictionary<int, decimal>> ObtenerPreciosPorListaAsync(int listaPrecioId, IEnumerable<int> productoIds)
    {
        var lista = await _listaPrecioRepo.GetByIdConDetallesAsync(listaPrecioId);
        if (lista is null) return new Dictionary<int, decimal>();

        var ids = new HashSet<int>(productoIds);
        return lista.Detalles
            .Where(d => ids.Contains(d.ProductoId))
            .ToDictionary(d => d.ProductoId, d => d.Precio);
    }

    private static ProductoDto ToDto(Producto p)
        => new(p.Id, p.Nombre, p.Descripcion, p.Precio, p.CategoriaId, p.Categoria?.Nombre ?? "", p.Activo, p.ImagenUrl, p.NumeroInterno, p.PesoGramos, p.UnidadesPorBulto, null, p.Marca, p.UnidadesPorMedia);

    private static ProductoDto ToDtoConPrecioLista(Producto p, Dictionary<int, decimal> precios)
    {
        var precioLista = precios.TryGetValue(p.Id, out var precio) ? (decimal?)precio : null;
        return new(p.Id, p.Nombre, p.Descripcion, p.Precio, p.CategoriaId, p.Categoria?.Nombre ?? "", p.Activo, p.ImagenUrl, p.NumeroInterno, p.PesoGramos, p.UnidadesPorBulto, precioLista, p.Marca, p.UnidadesPorMedia);
    }
}
