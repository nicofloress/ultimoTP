using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ComboConfiguration : IEntityTypeConfiguration<Combo>
{
    public void Configure(EntityTypeBuilder<Combo> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(c => c.Descripcion).HasMaxLength(500);
        builder.Property(c => c.Precio).HasColumnType("decimal(18,2)");

        builder.HasData(
            new Combo { Id = 1, Nombre = "Combo Clásico", Descripcion = "Hamburguesa Clásica + Papas + Coca-Cola", Precio = 6000m, Activo = true },
            new Combo { Id = 2, Nombre = "Combo Doble", Descripcion = "Hamburguesa Doble + Papas + Coca-Cola", Precio = 7500m, Activo = true }
        );
    }
}
