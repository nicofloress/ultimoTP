using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ProveedorConfiguration : IEntityTypeConfiguration<Proveedor>
{
    public void Configure(EntityTypeBuilder<Proveedor> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Contacto)
            .HasMaxLength(100);

        builder.Property(p => p.Telefono)
            .HasMaxLength(50);

        builder.Property(p => p.Direccion)
            .HasMaxLength(200);

        builder.HasQueryFilter(p => p.Activo);
    }
}
