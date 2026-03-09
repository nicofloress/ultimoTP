using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class ZonaConfiguration : IEntityTypeConfiguration<Zona>
{
    public void Configure(EntityTypeBuilder<Zona> builder)
    {
        builder.HasKey(z => z.Id);
        builder.Property(z => z.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(z => z.Descripcion).HasMaxLength(500);
        builder.Property(z => z.CostoEnvio).HasColumnType("decimal(18,2)");

        builder.HasData(
            new Zona { Id = 1, Nombre = "Norte", CostoEnvio = 0m, Activa = true },
            new Zona { Id = 2, Nombre = "Sur",   CostoEnvio = 0m, Activa = true }
        );
    }
}
