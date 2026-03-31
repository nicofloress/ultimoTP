using BurgerShop.Domain.Entities.Inventario;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Inventario;

public class EmpresaConfiguration : IEntityTypeConfiguration<Empresa>
{
    public void Configure(EntityTypeBuilder<Empresa> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.RazonSocial).IsRequired().HasMaxLength(200);
        builder.Property(e => e.NombreFantasia).HasMaxLength(200);
        builder.Property(e => e.Cuit).IsRequired().HasMaxLength(13);
        builder.Property(e => e.CondicionIva).IsRequired().HasMaxLength(50);
        builder.Property(e => e.DireccionFiscal).HasMaxLength(300);
        builder.Property(e => e.Localidad).HasMaxLength(100);
        builder.Property(e => e.Provincia).HasMaxLength(100);
        builder.Property(e => e.CodigoPostal).HasMaxLength(10);
        builder.Property(e => e.Telefono).HasMaxLength(50);
        builder.Property(e => e.Email).HasMaxLength(200);
        builder.Property(e => e.LogoUrl).HasMaxLength(500);
        builder.Property(e => e.IngresosBrutos).HasMaxLength(30);

        builder.HasIndex(e => e.Cuit).IsUnique();

        builder.HasMany(e => e.Locales)
            .WithOne(l => l.Empresa)
            .HasForeignKey(l => l.EmpresaId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
