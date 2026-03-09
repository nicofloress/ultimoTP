using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class TipoClienteConfiguration : IEntityTypeConfiguration<TipoCliente>
{
    public void Configure(EntityTypeBuilder<TipoCliente> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.Descripcion)
            .HasMaxLength(200);

        builder.HasQueryFilter(t => t.Activo);

        builder.HasData(
            new TipoCliente { Id = 1, Nombre = "Consumidor Final", Activo = true },
            new TipoCliente { Id = 2, Nombre = "Mayorista", Activo = true },
            new TipoCliente { Id = 3, Nombre = "Empleado", Activo = true }
        );
    }
}
