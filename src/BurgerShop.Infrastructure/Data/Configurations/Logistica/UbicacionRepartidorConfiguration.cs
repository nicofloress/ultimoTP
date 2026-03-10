using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class UbicacionRepartidorConfiguration : IEntityTypeConfiguration<UbicacionRepartidor>
{
    public void Configure(EntityTypeBuilder<UbicacionRepartidor> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Latitud).IsRequired();
        builder.Property(u => u.Longitud).IsRequired();
        builder.Property(u => u.FechaActualizacion).IsRequired();

        builder.HasOne(u => u.Repartidor)
            .WithMany()
            .HasForeignKey(u => u.RepartidorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(u => u.RepartidorId).IsUnique();
        builder.HasIndex(u => u.EstaActivo);
    }
}
