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
        builder.Property(p => p.NumeroInterno).HasMaxLength(50);
        builder.HasIndex(p => p.NumeroInterno).IsUnique().HasFilter(null);
        builder.Property(p => p.Marca).HasMaxLength(100);
        builder.Property(p => p.UnidadesPorMedia).HasDefaultValue(0);

        builder.HasOne(p => p.Categoria)
            .WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId);

        builder.HasData(
            // Cat 1 - Hamburguesa Económica 55gr
            new Producto { Id = 1,  Nombre = "Hamburguesa Eco 55gr",       Precio = 300m,   CategoriaId = 1,  Activo = true, Marca = "La Defensa",  PesoGramos = 55,  UnidadesPorBulto = 72, UnidadesPorMedia = 36 },

            // Cat 2 - Hamburguesa Económica 69gr
            new Producto { Id = 2,  Nombre = "Hamburguesa Eco 69gr",       Precio = 450m,   CategoriaId = 2,  Activo = true, Marca = "La Conquista", PesoGramos = 69,  UnidadesPorBulto = 60, UnidadesPorMedia = 30 },

            // Cat 3 - Hamburguesa Económica 80gr
            new Producto { Id = 3,  Nombre = "Hamburguesa Eco 80gr",       Precio = 550m,   CategoriaId = 3,  Activo = true, Marca = "Rancho Alto",  PesoGramos = 80,  UnidadesPorBulto = 60, UnidadesPorMedia = 30 },

            // Cat 4 - Hamburguesa Económica 110gr
            new Producto { Id = 4,  Nombre = "Hamburguesa Eco 110gr",      Precio = 750m,   CategoriaId = 4,  Activo = true, Marca = "La Defensa",   PesoGramos = 110, UnidadesPorBulto = 40, UnidadesPorMedia = 20 },

            // Cat 5 - Hamburguesa Premium 80gr
            new Producto { Id = 5,  Nombre = "Hamburguesa Premium 80gr",   Precio = 850m,   CategoriaId = 5,  Activo = true, Marca = "Finexcor",     PesoGramos = 80,  UnidadesPorBulto = 60, UnidadesPorMedia = 30 },

            // Cat 6 - Hamburguesa Premium 110gr
            new Producto { Id = 6,  Nombre = "Hamburguesa Premium 110gr",  Precio = 1100m,  CategoriaId = 6,  Activo = true, Marca = "Finexcor",     PesoGramos = 110, UnidadesPorBulto = 40, UnidadesPorMedia = 20 },

            // Cat 7 - Hamburguesa Premium 120gr
            new Producto { Id = 7,  Nombre = "Hamburguesa Premium 120gr",  Precio = 1300m,  CategoriaId = 7,  Activo = true, Marca = "Finexcor",     PesoGramos = 120, UnidadesPorBulto = 40, UnidadesPorMedia = 20 },

            // Cat 8 - Hamburguesa Premium 160gr
            new Producto { Id = 8,  Nombre = "Hamburguesa Premium 160gr",  Precio = 1800m,  CategoriaId = 8,  Activo = true, Marca = "Finexcor",     PesoGramos = 160, UnidadesPorBulto = 24, UnidadesPorMedia = 12 },

            // Cat 9 - Hamburguesa Premium 198gr
            new Producto { Id = 9,  Nombre = "Hamburguesa Premium 198gr",  Precio = 2200m,  CategoriaId = 9,  Activo = true, Marca = "Friar",        PesoGramos = 198, UnidadesPorBulto = 24, UnidadesPorMedia = 12 },

            // Cat 10 - Salchicha Corta
            new Producto { Id = 10, Nombre = "Salchicha Corta",            Precio = 350m,   CategoriaId = 10, Activo = true, Marca = "Jetfood",      PesoGramos = null, UnidadesPorBulto = 60, UnidadesPorMedia = 30 },

            // Cat 11 - Salchicha Larga
            new Producto { Id = 11, Nombre = "Salchicha Larga",            Precio = 500m,   CategoriaId = 11, Activo = true, Marca = "Delosan",      PesoGramos = null, UnidadesPorBulto = 60, UnidadesPorMedia = 36 },

            // Cat 12 - Pan Tradicional (paquete de 6 unidades)
            new Producto { Id = 12, Nombre = "Pan Tradicional",            Precio = 1200m,  CategoriaId = 12, Activo = true, Marca = null,           PesoGramos = null, UnidadesPorBulto = 6,  UnidadesPorMedia = 0 },

            // Cat 13 - Pan Maxi (paquete de 6 unidades)
            new Producto { Id = 13, Nombre = "Pan Maxi",                   Precio = 1500m,  CategoriaId = 13, Activo = true, Marca = null,           PesoGramos = null, UnidadesPorBulto = 6,  UnidadesPorMedia = 0 },

            // Cat 14 - Pan Pancho (paquete de 6 unidades)
            new Producto { Id = 14, Nombre = "Pan Pancho",                 Precio = 1000m,  CategoriaId = 14, Activo = true, Marca = null,           PesoGramos = null, UnidadesPorBulto = 6,  UnidadesPorMedia = 0 },

            // Cat 15 - Pan Super Pancho (paquete de 6 unidades)
            new Producto { Id = 15, Nombre = "Pan Super Pancho",           Precio = 1400m,  CategoriaId = 15, Activo = true, Marca = null,           PesoGramos = null, UnidadesPorBulto = 6,  UnidadesPorMedia = 0 },

            // Cat 16 - Aderezos
            new Producto { Id = 16, Nombre = "Aderezo Benidor",            Precio = 2500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = null, UnidadesPorBulto = 1,  UnidadesPorMedia = 0 }
        );
    }
}
