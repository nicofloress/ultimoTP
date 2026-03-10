using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class RepartidorConfiguration : IEntityTypeConfiguration<Repartidor>
{
    public void Configure(EntityTypeBuilder<Repartidor> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Telefono).HasMaxLength(50);
        builder.Property(r => r.Vehiculo).HasMaxLength(100);
        builder.Property(r => r.CodigoAcceso).IsRequired().HasMaxLength(10);

        builder.HasIndex(r => r.CodigoAcceso).IsUnique();

        builder.HasData(
            new Repartidor { Id = 1, Nombre = "Juan Pérez", Telefono = "11-1234-5678", Vehiculo = "Moto", CodigoAcceso = "1234", Activo = true },
            new Repartidor { Id = 2, Nombre = "María García", Telefono = "11-8765-4321", Vehiculo = "Bicicleta", CodigoAcceso = "5678", Activo = true },
            new Repartidor { Id = 3, Nombre = "Nico Flores", Telefono = "11-0000-0000", Vehiculo = "Moto", CodigoAcceso = "9999", Activo = true }
        );
    }
}
