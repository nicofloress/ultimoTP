using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Finanzas;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Data;

public class BurgerShopDbContext : DbContext
{
    public BurgerShopDbContext(DbContextOptions<BurgerShopDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Combo> Combos => Set<Combo>();
    public DbSet<ComboDetalle> ComboDetalles => Set<ComboDetalle>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<LineaPedido> LineasPedido => Set<LineaPedido>();
    public DbSet<FormaPago> FormasPago => Set<FormaPago>();
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Repartidor> Repartidores => Set<Repartidor>();
    public DbSet<RepartidorZona> RepartidorZonas => Set<RepartidorZona>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<TipoCliente> TiposCliente => Set<TipoCliente>();
    public DbSet<ListaPrecio> ListasPrecios => Set<ListaPrecio>();
    public DbSet<ListaPrecioDetalle> ListasPreciosDetalle => Set<ListaPrecioDetalle>();
    public DbSet<PagoPedido> PagosPedido => Set<PagoPedido>();
    public DbSet<CierreCaja> CierresCaja => Set<CierreCaja>();
    public DbSet<CierreCajaDetalle> CierresCajaDetalle => Set<CierreCajaDetalle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BurgerShopDbContext).Assembly);
    }
}
