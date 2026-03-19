using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class RendicionRepartidorConfiguration : IEntityTypeConfiguration<RendicionRepartidor>
{
    public void Configure(EntityTypeBuilder<RendicionRepartidor> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.TotalEfectivo)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(r => r.TotalTransferencia)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(r => r.TotalNoEntregado)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(r => r.EfectivoDeclarado)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(r => r.Diferencia)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(r => r.Observaciones)
            .HasMaxLength(1000);

        builder.HasOne(r => r.Repartidor)
            .WithMany()
            .HasForeignKey(r => r.RepartidorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.RepartoZona)
            .WithMany()
            .HasForeignKey(r => r.RepartoZonaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => r.RepartidorId);
        builder.HasIndex(r => r.Fecha);
        builder.HasIndex(r => r.RepartoZonaId);
    }
}
