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
            new Zona { Id = 1, Nombre = "Centro", Descripcion = "Zona céntrica", CostoEnvio = 500m, Activa = true },
            new Zona { Id = 2, Nombre = "Norte", Descripcion = "Zona norte", CostoEnvio = 800m, Activa = true },
            new Zona { Id = 3, Nombre = "Sur", Descripcion = "Zona sur", CostoEnvio = 800m, Activa = true }
        );
    }
}
