using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class RepartidorZonaConfiguration : IEntityTypeConfiguration<RepartidorZona>
{
    public void Configure(EntityTypeBuilder<RepartidorZona> builder)
    {
        builder.HasKey(rz => new { rz.RepartidorId, rz.ZonaId });

        builder.HasOne(rz => rz.Repartidor)
            .WithMany(r => r.RepartidorZonas)
            .HasForeignKey(rz => rz.RepartidorId);

        builder.HasOne(rz => rz.Zona)
            .WithMany(z => z.RepartidorZonas)
            .HasForeignKey(rz => rz.ZonaId);

        builder.HasData(
            // Repartidor 1 cubre Norte y Sur
            new RepartidorZona { RepartidorId = 1, ZonaId = 1 },
            new RepartidorZona { RepartidorId = 1, ZonaId = 2 },
            // Repartidor 2 cubre Norte y Sur
            new RepartidorZona { RepartidorId = 2, ZonaId = 1 },
            new RepartidorZona { RepartidorId = 2, ZonaId = 2 }
        );
    }
}
