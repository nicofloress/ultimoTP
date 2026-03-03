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
            new ComboDetalle { ComboId = 1, ProductoId = 1, Cantidad = 1 },
            new ComboDetalle { ComboId = 1, ProductoId = 6, Cantidad = 1 },
            new ComboDetalle { ComboId = 1, ProductoId = 4, Cantidad = 1 },
            new ComboDetalle { ComboId = 2, ProductoId = 2, Cantidad = 1 },
            new ComboDetalle { ComboId = 2, ProductoId = 6, Cantidad = 1 },
            new ComboDetalle { ComboId = 2, ProductoId = 4, Cantidad = 1 }
        );
    }
}
