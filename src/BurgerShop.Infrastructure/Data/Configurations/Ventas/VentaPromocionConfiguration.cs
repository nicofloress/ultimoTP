using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class VentaPromocionConfiguration : IEntityTypeConfiguration<VentaPromocion>
{
    public void Configure(EntityTypeBuilder<VentaPromocion> builder)
    {
        builder.HasKey(vp => vp.Id);

        builder.Property(vp => vp.NombrePromocion)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(vp => vp.MontoDescuento).HasColumnType("decimal(18,2)");
        builder.Property(vp => vp.MontoReintegro).HasColumnType("decimal(18,2)");

        builder.HasOne(vp => vp.Venta)
            .WithMany(v => v.Promociones)
            .HasForeignKey(vp => vp.VentaId)
            .OnDelete(DeleteBehavior.Cascade);

        // No cascade delete from Promocion: si se elimina la promo, la VentaPromocion se queda con el snapshot
        builder.HasOne(vp => vp.Promocion)
            .WithMany()
            .HasForeignKey(vp => vp.PromocionId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasIndex(vp => vp.VentaId);
        builder.HasIndex(vp => vp.PromocionId);
    }
}
