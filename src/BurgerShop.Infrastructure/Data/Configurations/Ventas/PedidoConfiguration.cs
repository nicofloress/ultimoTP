using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class VentaConfiguration : IEntityTypeConfiguration<Venta>
{
    public void Configure(EntityTypeBuilder<Venta> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.NumeroTicket).IsRequired().HasMaxLength(20);
        builder.Property(v => v.NombreCliente).HasMaxLength(200);
        builder.Property(v => v.TelefonoCliente).HasMaxLength(50);
        builder.Property(v => v.DireccionEntrega).HasMaxLength(500);
        builder.Property(v => v.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Descuento).HasColumnType("decimal(18,2)");
        builder.Property(v => v.DescuentoPromociones).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(v => v.ReintegroPromociones).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(v => v.Recargo).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Total).HasColumnType("decimal(18,2)");
        builder.Property(v => v.NotasEntrega).HasMaxLength(1000);
        builder.Property(v => v.NotaInterna).HasMaxLength(1000);
        builder.Property(v => v.MotivoCancelacion).HasMaxLength(500);
        builder.Property(v => v.Observaciones).HasMaxLength(1000);

        builder.HasOne(v => v.Cliente)
            .WithMany(c => c.Ventas)
            .HasForeignKey(v => v.ClienteId)
            .IsRequired(false);

        builder.HasOne(v => v.Local)
            .WithMany()
            .HasForeignKey(v => v.LocalId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(v => v.Zona)
            .WithMany()
            .HasForeignKey(v => v.ZonaId)
            .IsRequired(false);

        builder.HasOne(v => v.FormaPago)
            .WithMany()
            .HasForeignKey(v => v.FormaPagoId)
            .IsRequired(false);

        builder.HasOne(v => v.Repartidor)
            .WithMany(r => r.Ventas)
            .HasForeignKey(v => v.RepartidorId)
            .IsRequired(false);

        builder.HasOne(v => v.CierreCaja)
            .WithMany(c => c.Ventas)
            .HasForeignKey(v => v.CierreCajaId)
            .IsRequired(false);

        builder.HasOne(v => v.RepartoZona)
            .WithMany()
            .HasForeignKey(v => v.RepartoZonaId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(v => v.Usuario)
            .WithMany()
            .HasForeignKey(v => v.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.Property(v => v.FechaProgramada).IsRequired(false);

        builder.HasIndex(v => v.NumeroTicket).IsUnique();
        builder.HasIndex(v => v.FechaCreacion);
        builder.HasIndex(v => v.FechaProgramada);
        builder.HasIndex(v => v.Estado);
        builder.HasIndex(v => v.LocalId);
    }
}
