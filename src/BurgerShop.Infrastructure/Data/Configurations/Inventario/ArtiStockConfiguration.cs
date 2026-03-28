using BurgerShop.Domain.Entities.Inventario;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Inventario;

public class ArtiStockConfiguration : IEntityTypeConfiguration<ArtiStock>
{
    public void Configure(EntityTypeBuilder<ArtiStock> builder)
    {
        // PK compuesta: un registro de stock por producto por local
        builder.HasKey(a => new { a.ProductoId, a.LocalId });

        builder.Property(a => a.IngresoLocal)
            .HasColumnType("decimal(18,2)");

        builder.Property(a => a.EgresoLocal)
            .HasColumnType("decimal(18,2)");

        builder.Property(a => a.VentaLocal)
            .HasColumnType("decimal(18,2)");

        builder.Property(a => a.StockFinal)
            .HasColumnType("decimal(18,2)");

        builder.Property(a => a.StockMinimo)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(a => a.Producto)
            .WithMany()
            .HasForeignKey(a => a.ProductoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Local)
            .WithMany()
            .HasForeignKey(a => a.LocalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.LocalId);
    }
}
