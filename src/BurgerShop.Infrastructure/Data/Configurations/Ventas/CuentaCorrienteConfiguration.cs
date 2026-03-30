using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class CuentaCorrienteConfiguration : IEntityTypeConfiguration<CuentaCorriente>
{
    public void Configure(EntityTypeBuilder<CuentaCorriente> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.SaldoActual)
            .HasColumnType("decimal(18,2)");

        builder.Property(c => c.LimiteCredito)
            .HasColumnType("decimal(18,2)");

        // Relacion 1:1 con Cliente
        builder.HasOne(c => c.Cliente)
            .WithOne()
            .HasForeignKey<CuentaCorriente>(c => c.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.ClienteId).IsUnique();

        // Movimientos de la cuenta
        builder.HasMany(c => c.Movimientos)
            .WithOne(m => m.CuentaCorriente)
            .HasForeignKey(m => m.CuentaCorrienteId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
