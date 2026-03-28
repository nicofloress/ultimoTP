using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class VentaDetalleConfiguration : IEntityTypeConfiguration<VentaDetalle>
{
    public void Configure(EntityTypeBuilder<VentaDetalle> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Descripcion).IsRequired().HasMaxLength(200);
        builder.Property(d => d.PrecioUnitario).HasColumnType("decimal(18,2)");
        builder.Property(d => d.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(d => d.Notas).HasMaxLength(500);

        builder.HasOne(d => d.Venta)
            .WithMany(v => v.Detalles)
            .HasForeignKey(d => d.VentaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Producto)
            .WithMany()
            .HasForeignKey(d => d.ProductoId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(d => d.Combo)
            .WithMany()
            .HasForeignKey(d => d.ComboId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
