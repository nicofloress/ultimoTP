using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class RepartoZonaConfiguration : IEntityTypeConfiguration<RepartoZona>
{
    public void Configure(EntityTypeBuilder<RepartoZona> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => new { r.ZonaId, r.Fecha }).IsUnique();
        builder.Property(r => r.Fecha).HasColumnType("date");

        builder.HasOne(r => r.Zona)
            .WithMany()
            .HasForeignKey(r => r.ZonaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Repartidor)
            .WithMany()
            .HasForeignKey(r => r.RepartidorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
