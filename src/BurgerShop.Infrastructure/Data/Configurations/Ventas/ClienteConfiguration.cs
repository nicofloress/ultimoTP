using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Telefono).HasMaxLength(50);
        builder.Property(c => c.Direccion).HasMaxLength(500);

        builder.HasOne(c => c.Zona)
            .WithMany()
            .HasForeignKey(c => c.ZonaId)
            .IsRequired(false);

        builder.HasOne(c => c.TipoCliente)
            .WithMany()
            .HasForeignKey(c => c.TipoClienteId)
            .IsRequired(false);

        builder.HasOne(c => c.ListaPrecio)
            .WithMany()
            .HasForeignKey(c => c.ListaPrecioId)
            .IsRequired(false);
    }
}
