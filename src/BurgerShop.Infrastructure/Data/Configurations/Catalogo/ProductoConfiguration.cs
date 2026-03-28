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

            // Cat 16 - Aderezos Benidor
            new Producto { Id = 16, Nombre = "Mayonesa 250gr",             Precio = 2500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 250,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 17, Nombre = "Mayonesa 500gr",             Precio = 4000m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 18, Nombre = "Ketchup 250gr",              Precio = 2500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 250,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 19, Nombre = "Ketchup 500gr",              Precio = 4000m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 20, Nombre = "Mostaza 250gr",              Precio = 2500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 250,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 21, Nombre = "Mostaza 500gr",              Precio = 4000m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 22, Nombre = "Cheddar 500gr",              Precio = 4500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 23, Nombre = "Parmesano 500gr",            Precio = 4500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },
            new Producto { Id = 24, Nombre = "Barbacoa 500gr",             Precio = 4500m,  CategoriaId = 16, Activo = true, Marca = "Benidor",      PesoGramos = 500,  UnidadesPorBulto = 1,  UnidadesPorMedia = 0 },

            // Cat 19 - Snacks Krachitos (13 productos)
            new Producto { Id = 25, Nombre = "Krachitos Combo con papa 600gr",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 600,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 26, Nombre = "Krachitos Combo con papa 350gr",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 350,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 27, Nombre = "Krachitos Combo 600gr SIN MANI",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 600,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 28, Nombre = "Krachitos Combo 350gr SIN MANI",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 350,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 29, Nombre = "Krachitos Maicitos 400gr",            Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 400,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 30, Nombre = "Krachitos Bastoncito Queso 300gr",   Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 300,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 31, Nombre = "Krachitos Papas Cheddar 350gr",      Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 350,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 32, Nombre = "Krachitos Papas Americanas 600gr",   Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 600,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 33, Nombre = "Krachitos Papas fritas comunes 600gr", Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 600, UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 34, Nombre = "Krachitos Mani Krachitos 500gr",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 500,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 35, Nombre = "Krachitos Mani cervecero 500gr",     Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 500,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 36, Nombre = "Krachitos Palitos de Queso 500gr",   Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 500,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 37, Nombre = "Krachitos Palitos 800gr",            Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Krachitos", PesoGramos = 800,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },

            // Cat 19 - Snacks Riquitos (9 productos)
            new Producto { Id = 38, Nombre = "Riquitos Combo Palitos 330gr+Papas 460gr+Palitos 400gr 1kg", Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 1000, UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 39, Nombre = "Riquitos Palitos 400gr",             Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 400,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 40, Nombre = "Riquitos Chizitos 330gr",            Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 330,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 41, Nombre = "Riquitos Chizitos 1kg",              Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 1000, UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 42, Nombre = "Riquitos Papas pay 500gr",           Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 500,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 43, Nombre = "Riquitos Papas tradicionales 1kg",   Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 1000, UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 44, Nombre = "Riquitos Papas tradicionales 460gr", Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 460,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 45, Nombre = "Riquitos Papas Cheddar 460gr",       Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 460,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 },
            new Producto { Id = 46, Nombre = "Riquitos Papas Jamon Serrano 400gr", Precio = 0m, CategoriaId = 19, Activo = true, Marca = "Riquitos", PesoGramos = 400,  UnidadesPorBulto = 1, UnidadesPorMedia = 0 }
        );
    }
}
