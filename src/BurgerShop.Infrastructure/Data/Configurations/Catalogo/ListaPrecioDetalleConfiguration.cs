using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ListaPrecioDetalleConfiguration : IEntityTypeConfiguration<ListaPrecioDetalle>
{
    public void Configure(EntityTypeBuilder<ListaPrecioDetalle> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Precio).HasColumnType("decimal(18,2)");

        builder.HasOne(d => d.ListaPrecio)
            .WithMany(l => l.Detalles)
            .HasForeignKey(d => d.ListaPrecioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Producto)
            .WithMany()
            .HasForeignKey(d => d.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => new { d.ListaPrecioId, d.ProductoId }).IsUnique();
    }
}
