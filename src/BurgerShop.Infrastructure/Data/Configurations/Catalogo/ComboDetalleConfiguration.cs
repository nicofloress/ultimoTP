using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ComboDetalleConfiguration : IEntityTypeConfiguration<ComboDetalle>
{
    public void Configure(EntityTypeBuilder<ComboDetalle> builder)
    {
        builder.HasKey(cd => new { cd.ComboId, cd.ProductoId });

        builder.HasOne(cd => cd.Combo)
            .WithMany(c => c.Detalles)
            .HasForeignKey(cd => cd.ComboId);

        builder.HasOne(cd => cd.Producto)
            .WithMany(p => p.ComboDetalles)
            .HasForeignKey(cd => cd.ProductoId);

        builder.HasData(
            // Combo 1: Promo 40 Hamburguesas + Pan (Hamburguesa x40 + Pan Hamburguesa x30 x2 packs)
            new ComboDetalle { ComboId = 1, ProductoId = 6,  Cantidad = 1 }, // Hamburguesa x40
            new ComboDetalle { ComboId = 1, ProductoId = 23, Cantidad = 2 }, // Pan Hamburguesa x30 (2 packs = 60 — aprox)

            // Combo 2: Promo 30 Hamburguesas + Pan (Hamburguesa x30 + Pan Hamburguesa x30)
            new ComboDetalle { ComboId = 2, ProductoId = 5,  Cantidad = 1 }, // Hamburguesa x30
            new ComboDetalle { ComboId = 2, ProductoId = 23, Cantidad = 1 }, // Pan Hamburguesa x30

            // Combo 3: Promo 30 Panchos (Pancho x24 + Pancho x6 + Pan Pancho x12 x2 packs + Pan Pancho x6)
            new ComboDetalle { ComboId = 3, ProductoId = 29, Cantidad = 1 }, // Pancho x24
            new ComboDetalle { ComboId = 3, ProductoId = 27, Cantidad = 1 }, // Pancho x6
            new ComboDetalle { ComboId = 3, ProductoId = 33, Cantidad = 2 }, // Pan Pancho x12

            // Combo 4: Promo 18 Super Panchos (Super Pancho x6 x3 packs + Pan Super Pancho x6 x3 packs)
            new ComboDetalle { ComboId = 4, ProductoId = 34, Cantidad = 3 }, // Super Pancho x6
            new ComboDetalle { ComboId = 4, ProductoId = 38, Cantidad = 3 }, // Pan Super Pancho x6

            // Combo 5: Promo 36 Super Panchos (Super Pancho x12 x3 packs + Pan Super Pancho x12 x3 packs)
            new ComboDetalle { ComboId = 5, ProductoId = 35, Cantidad = 3 }, // Super Pancho x12
            new ComboDetalle { ComboId = 5, ProductoId = 39, Cantidad = 3 }  // Pan Super Pancho x12
        );
    }
}
