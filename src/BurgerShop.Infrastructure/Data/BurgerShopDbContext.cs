using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;

namespace BurgerShop.Infrastructure.Data;

public class BurgerShopDbContext : DbContext
{
    public BurgerShopDbContext(DbContextOptions<BurgerShopDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Combo> Combos => Set<Combo>();
    public DbSet<ComboDetalle> ComboDetalles => Set<ComboDetalle>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<LineaPedido> LineasPedido => Set<LineaPedido>();
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Repartidor> Repartidores => Set<Repartidor>();
    public DbSet<RepartidorZona> RepartidorZonas => Set<RepartidorZona>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BurgerShopDbContext).Assembly);
    }
}
