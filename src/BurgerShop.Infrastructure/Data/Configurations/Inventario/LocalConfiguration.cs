using BurgerShop.Domain.Entities.Inventario;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Inventario;

public class LocalConfiguration : IEntityTypeConfiguration<Local>
{
    public void Configure(EntityTypeBuilder<Local> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(l => l.Direccion).HasMaxLength(500);

        builder.HasData(
            new Local { Id = 1, Nombre = "Local Principal", EsPuntoVenta = true, Activo = true }
        );
    }
}
