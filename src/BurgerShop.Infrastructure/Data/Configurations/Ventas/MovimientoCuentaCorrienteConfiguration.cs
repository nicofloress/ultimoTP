using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class MovimientoCuentaCorrienteConfiguration : IEntityTypeConfiguration<MovimientoCuentaCorriente>
{
    public void Configure(EntityTypeBuilder<MovimientoCuentaCorriente> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Monto)
            .HasColumnType("decimal(18,2)");

        builder.Property(m => m.SaldoResultante)
            .HasColumnType("decimal(18,2)");

        builder.Property(m => m.Observaciones)
            .HasMaxLength(500);

        // CuentaCorriente — requerido, Cascade (configurado desde CuentaCorrienteConfiguration)
        // La FK ya queda definida en CuentaCorrienteConfiguration.HasMany(...).WithOne(...)
        // Solo necesitamos configurar las FKs opcionales aqui.

        // Venta — opcional, SetNull
        builder.HasOne(m => m.Venta)
            .WithMany()
            .HasForeignKey(m => m.VentaId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Movimiento (Inventario) — opcional, SetNull
        builder.HasOne(m => m.Movimiento)
            .WithMany()
            .HasForeignKey(m => m.MovimientoId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Usuario — opcional, SetNull
        builder.HasOne(m => m.Usuario)
            .WithMany()
            .HasForeignKey(m => m.UsuarioId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Indices
        builder.HasIndex(m => new { m.CuentaCorrienteId, m.FechaMovimiento });
        builder.HasIndex(m => m.VentaId)
            .HasFilter("\"VentaId\" IS NOT NULL");
    }
}
