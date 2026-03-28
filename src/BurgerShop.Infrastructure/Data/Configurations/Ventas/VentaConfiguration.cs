using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class VentaConfiguration : IEntityTypeConfiguration<Venta>
{
    public void Configure(EntityTypeBuilder<Venta> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.NumeroVenta).IsRequired().HasMaxLength(20);
        builder.HasIndex(v => v.NumeroVenta).IsUnique();

        builder.Property(v => v.NombreCliente).HasMaxLength(200);
        builder.Property(v => v.TelefonoCliente).HasMaxLength(50);
        builder.Property(v => v.Observaciones).HasMaxLength(1000);

        builder.Property(v => v.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Descuento).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Recargo).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Total).HasColumnType("decimal(18,2)");

        builder.HasOne(v => v.Cliente)
            .WithMany()
            .HasForeignKey(v => v.ClienteId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(v => v.FormaPago)
            .WithMany()
            .HasForeignKey(v => v.FormaPagoId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(v => v.Pedido)
            .WithOne()
            .HasForeignKey<Venta>(v => v.PedidoId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(v => v.Local)
            .WithMany()
            .HasForeignKey(v => v.LocalId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(true);

        builder.HasOne(v => v.Usuario)
            .WithMany()
            .HasForeignKey(v => v.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(v => v.PedidoId)
            .IsUnique()
            .HasFilter("\"PedidoId\" IS NOT NULL");

        builder.HasIndex(v => v.Fecha);
        builder.HasIndex(v => v.LocalId);
    }
}
