using BurgerShop.Domain.Entities.Finanzas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Finanzas;

public class GastoConfiguration : IEntityTypeConfiguration<Gasto>
{
    public void Configure(EntityTypeBuilder<Gasto> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Nombre)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(g => g.Categoria)
            .HasMaxLength(100);

        builder.Property(g => g.Proveedor)
            .HasMaxLength(200);

        builder.Property(g => g.Etiqueta)
            .HasMaxLength(100);

        builder.Property(g => g.Subtotal)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(g => g.Iva)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(g => g.Total)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(g => g.Deuda)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(g => g.Observaciones)
            .HasMaxLength(1000);

        builder.HasOne(g => g.FormaPago)
            .WithMany()
            .HasForeignKey(g => g.FormaPagoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(g => g.Local)
            .WithMany()
            .HasForeignKey(g => g.LocalId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(g => g.LocalId);
        builder.HasIndex(g => g.FechaGasto);
        builder.HasIndex(g => g.Activo);
    }
}
