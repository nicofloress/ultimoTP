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

        builder.HasOne(p => p.Categoria)
            .WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId);

        builder.HasData(
            // Cat 1 - Hamburguesas (MedallonEconomico) - 80g por defecto
            new Producto { Id = 1,  Nombre = "Hamburguesa x 1",   Precio = 50m,   CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-001", UnidadesPorBulto = 1,  PesoGramos = 80 },
            new Producto { Id = 2,  Nombre = "Hamburguesa x 2",   Precio = 100m,  CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-002", UnidadesPorBulto = 2,  PesoGramos = 80 },
            new Producto { Id = 3,  Nombre = "Hamburguesa x 6",   Precio = 250m,  CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-003", UnidadesPorBulto = 6,  PesoGramos = 80 },
            new Producto { Id = 4,  Nombre = "Hamburguesa x 12",  Precio = 400m,  CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-004", UnidadesPorBulto = 12, PesoGramos = 80 },
            new Producto { Id = 5,  Nombre = "Hamburguesa x 30",  Precio = 750m,  CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-005", UnidadesPorBulto = 30, PesoGramos = 80 },
            new Producto { Id = 6,  Nombre = "Hamburguesa x 40",  Precio = 940m,  CategoriaId = 1,  Activo = true, NumeroInterno = "HAM-006", UnidadesPorBulto = 40, PesoGramos = 80 },

            // Cat 2 - Maxi Hamburguesas (HamburguesaPremium) - 110g
            new Producto { Id = 7,  Nombre = "Maxi Hamburguesa x 1",  Precio = 70m,   CategoriaId = 2,  Activo = true, NumeroInterno = "MAX-001", UnidadesPorBulto = 1,  PesoGramos = 110 },
            new Producto { Id = 8,  Nombre = "Maxi Hamburguesa x 2",  Precio = 130m,  CategoriaId = 2,  Activo = true, NumeroInterno = "MAX-002", UnidadesPorBulto = 2,  PesoGramos = 110 },
            new Producto { Id = 9,  Nombre = "Maxi Hamburguesa x 4",  Precio = 260m,  CategoriaId = 2,  Activo = true, NumeroInterno = "MAX-003", UnidadesPorBulto = 4,  PesoGramos = 110 },
            new Producto { Id = 10, Nombre = "Maxi Hamburguesa x 12", Precio = 680m,  CategoriaId = 2,  Activo = true, NumeroInterno = "MAX-004", UnidadesPorBulto = 12, PesoGramos = 110 },
            new Producto { Id = 11, Nombre = "Maxi Hamburguesa x 20", Precio = 1100m, CategoriaId = 2,  Activo = true, NumeroInterno = "MAX-005", UnidadesPorBulto = 20, PesoGramos = 110 },

            // Cat 3 - Super Hamburguesas (HamburguesaPremium) - 120g
            new Producto { Id = 12, Nombre = "Super Hamburguesa x 1",  Precio = 100m,  CategoriaId = 3,  Activo = true, NumeroInterno = "SUP-001", UnidadesPorBulto = 1,  PesoGramos = 120 },
            new Producto { Id = 13, Nombre = "Super Hamburguesa x 2",  Precio = 180m,  CategoriaId = 3,  Activo = true, NumeroInterno = "SUP-002", UnidadesPorBulto = 2,  PesoGramos = 120 },
            new Producto { Id = 14, Nombre = "Super Hamburguesa x 4",  Precio = 350m,  CategoriaId = 3,  Activo = true, NumeroInterno = "SUP-003", UnidadesPorBulto = 4,  PesoGramos = 120 },
            new Producto { Id = 15, Nombre = "Super Hamburguesa x 12", Precio = 1000m, CategoriaId = 3,  Activo = true, NumeroInterno = "SUP-004", UnidadesPorBulto = 12, PesoGramos = 120 },

            // Cat 4 - Mega Hamburguesas (HamburguesaPremium) - 160g
            new Producto { Id = 16, Nombre = "Mega Hamburguesa x 1",  Precio = 120m,  CategoriaId = 4,  Activo = true, NumeroInterno = "MEG-001", UnidadesPorBulto = 1,  PesoGramos = 160 },
            new Producto { Id = 17, Nombre = "Mega Hamburguesa x 2",  Precio = 220m,  CategoriaId = 4,  Activo = true, NumeroInterno = "MEG-002", UnidadesPorBulto = 2,  PesoGramos = 160 },
            new Producto { Id = 18, Nombre = "Mega Hamburguesa x 4",  Precio = 420m,  CategoriaId = 4,  Activo = true, NumeroInterno = "MEG-003", UnidadesPorBulto = 4,  PesoGramos = 160 },
            new Producto { Id = 19, Nombre = "Mega Hamburguesa x 12", Precio = 1200m, CategoriaId = 4,  Activo = true, NumeroInterno = "MEG-004", UnidadesPorBulto = 12, PesoGramos = 160 },

            // Cat 5 - Pan Hamburguesa (PanTradicional)
            new Producto { Id = 20, Nombre = "Pan Hamburguesa x 2",  Precio = 80m,   CategoriaId = 5,  Activo = true, NumeroInterno = "PHA-001", UnidadesPorBulto = 2 },
            new Producto { Id = 21, Nombre = "Pan Hamburguesa x 6",  Precio = 200m,  CategoriaId = 5,  Activo = true, NumeroInterno = "PHA-002", UnidadesPorBulto = 6 },
            new Producto { Id = 22, Nombre = "Pan Hamburguesa x 12", Precio = 360m,  CategoriaId = 5,  Activo = true, NumeroInterno = "PHA-003", UnidadesPorBulto = 12 },
            new Producto { Id = 23, Nombre = "Pan Hamburguesa x 30", Precio = 800m,  CategoriaId = 5,  Activo = true, NumeroInterno = "PHA-004", UnidadesPorBulto = 30 },

            // Cat 6 - Pan Maxi Hamburguesa (PanMaxi)
            new Producto { Id = 24, Nombre = "Pan Maxi x 2",  Precio = 100m,  CategoriaId = 6,  Activo = true, NumeroInterno = "PMA-001", UnidadesPorBulto = 2 },
            new Producto { Id = 25, Nombre = "Pan Maxi x 6",  Precio = 260m,  CategoriaId = 6,  Activo = true, NumeroInterno = "PMA-002", UnidadesPorBulto = 6 },
            new Producto { Id = 26, Nombre = "Pan Maxi x 12", Precio = 480m,  CategoriaId = 6,  Activo = true, NumeroInterno = "PMA-003", UnidadesPorBulto = 12 },

            // Cat 7 - Panchos (SalchichaCorta)
            new Producto { Id = 27, Nombre = "Pancho x 6",  Precio = 150m,  CategoriaId = 7,  Activo = true, NumeroInterno = "PAN-001", UnidadesPorBulto = 6 },
            new Producto { Id = 28, Nombre = "Pancho x 12", Precio = 260m,  CategoriaId = 7,  Activo = true, NumeroInterno = "PAN-002", UnidadesPorBulto = 12 },
            new Producto { Id = 29, Nombre = "Pancho x 24", Precio = 480m,  CategoriaId = 7,  Activo = true, NumeroInterno = "PAN-003", UnidadesPorBulto = 24 },

            // Cat 8 - Salchichas (SalchichaCorta)
            new Producto { Id = 30, Nombre = "Salchicha x 6",  Precio = 180m,  CategoriaId = 8,  Activo = true, NumeroInterno = "SAL-001", UnidadesPorBulto = 6 },
            new Producto { Id = 31, Nombre = "Salchicha x 12", Precio = 320m,  CategoriaId = 8,  Activo = true, NumeroInterno = "SAL-002", UnidadesPorBulto = 12 },

            // Cat 9 - Pan Pancho (PanPancho)
            new Producto { Id = 32, Nombre = "Pan Pancho x 6",  Precio = 100m,  CategoriaId = 9,  Activo = true, NumeroInterno = "PPH-001", UnidadesPorBulto = 6 },
            new Producto { Id = 33, Nombre = "Pan Pancho x 12", Precio = 180m,  CategoriaId = 9,  Activo = true, NumeroInterno = "PPH-002", UnidadesPorBulto = 12 },

            // Cat 10 - Super Panchos (SalchichaLarga)
            new Producto { Id = 34, Nombre = "Super Pancho x 6",  Precio = 200m,  CategoriaId = 10, Activo = true, NumeroInterno = "SPC-001", UnidadesPorBulto = 6 },
            new Producto { Id = 35, Nombre = "Super Pancho x 12", Precio = 380m,  CategoriaId = 10, Activo = true, NumeroInterno = "SPC-002", UnidadesPorBulto = 12 },

            // Cat 11 - Salchichas Largas (SalchichaLarga)
            new Producto { Id = 36, Nombre = "Salchicha Larga x 6",  Precio = 220m,  CategoriaId = 11, Activo = true, NumeroInterno = "SLA-001", UnidadesPorBulto = 6 },
            new Producto { Id = 37, Nombre = "Salchicha Larga x 12", Precio = 400m,  CategoriaId = 11, Activo = true, NumeroInterno = "SLA-002", UnidadesPorBulto = 12 },

            // Cat 12 - Pan Super Pancho (PanSuperPancho)
            new Producto { Id = 38, Nombre = "Pan Super Pancho x 6",  Precio = 130m,  CategoriaId = 12, Activo = true, NumeroInterno = "PSP-001", UnidadesPorBulto = 6 },
            new Producto { Id = 39, Nombre = "Pan Super Pancho x 12", Precio = 240m,  CategoriaId = 12, Activo = true, NumeroInterno = "PSP-002", UnidadesPorBulto = 12 },

            // Cat 13 - Aderezos (Aderezo)
            new Producto { Id = 40, Nombre = "Mayonesa",  Precio = 80m,  CategoriaId = 13, Activo = true, NumeroInterno = "ADR-001", UnidadesPorBulto = 1 },
            new Producto { Id = 41, Nombre = "Ketchup",   Precio = 80m,  CategoriaId = 13, Activo = true, NumeroInterno = "ADR-002", UnidadesPorBulto = 1 },
            new Producto { Id = 42, Nombre = "Mostaza",   Precio = 80m,  CategoriaId = 13, Activo = true, NumeroInterno = "ADR-003", UnidadesPorBulto = 1 },

            // Cat 14 - Snacks (Otro)
            new Producto { Id = 43, Nombre = "Papas Congeladas x 1kg", Precio = 300m,  CategoriaId = 14, Activo = true, NumeroInterno = "SNK-001", UnidadesPorBulto = 1 },

            // Cat 15 - Congelados (Otro)
            new Producto { Id = 44, Nombre = "Empanadas x 12",  Precio = 500m,  CategoriaId = 15, Activo = true, NumeroInterno = "CON-001", UnidadesPorBulto = 12 },
            new Producto { Id = 45, Nombre = "Milanesas x 4",   Precio = 450m,  CategoriaId = 15, Activo = true, NumeroInterno = "CON-002", UnidadesPorBulto = 4 },

            // Cat 16 - Bebidas (Otro)
            new Producto { Id = 46, Nombre = "Coca Cola 1.5L", Precio = 200m,  CategoriaId = 16, Activo = true, NumeroInterno = "BEB-001", UnidadesPorBulto = 1 },
            new Producto { Id = 47, Nombre = "Sprite 1.5L",    Precio = 200m,  CategoriaId = 16, Activo = true, NumeroInterno = "BEB-002", UnidadesPorBulto = 1 },
            new Producto { Id = 48, Nombre = "Agua 500ml",     Precio = 100m,  CategoriaId = 16, Activo = true, NumeroInterno = "BEB-003", UnidadesPorBulto = 1 }
        );
    }
}
