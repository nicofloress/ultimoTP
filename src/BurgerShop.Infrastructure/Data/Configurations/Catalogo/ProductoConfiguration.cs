using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(p => p.Descripcion).HasMaxLength(500);
        builder.Property(p => p.Precio).HasColumnType("decimal(18,2)");
        builder.Property(p => p.ImagenUrl).HasMaxLength(500);

        builder.HasOne(p => p.Categoria)
            .WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId);

        builder.HasData(
            new Producto { Id = 1, Nombre = "Hamburguesa Clásica", Descripcion = "Carne, lechuga, tomate, queso", Precio = 3500m, CategoriaId = 1, Activo = true },
            new Producto { Id = 2, Nombre = "Hamburguesa Doble", Descripcion = "Doble carne, doble queso", Precio = 5000m, CategoriaId = 1, Activo = true },
            new Producto { Id = 3, Nombre = "Hamburguesa Bacon", Descripcion = "Carne, bacon, queso cheddar", Precio = 4500m, CategoriaId = 1, Activo = true },
            new Producto { Id = 4, Nombre = "Coca-Cola 500ml", Precio = 1500m, CategoriaId = 2, Activo = true },
            new Producto { Id = 5, Nombre = "Agua Mineral 500ml", Precio = 1000m, CategoriaId = 2, Activo = true },
            new Producto { Id = 6, Nombre = "Papas Fritas", Descripcion = "Porción grande", Precio = 2000m, CategoriaId = 3, Activo = true },
            new Producto { Id = 7, Nombre = "Aros de Cebolla", Descripcion = "Porción de 8 unidades", Precio = 2500m, CategoriaId = 3, Activo = true },
            new Producto { Id = 8, Nombre = "Brownie", Descripcion = "Brownie de chocolate con nuez", Precio = 2000m, CategoriaId = 4, Activo = true }
        );
    }
}
