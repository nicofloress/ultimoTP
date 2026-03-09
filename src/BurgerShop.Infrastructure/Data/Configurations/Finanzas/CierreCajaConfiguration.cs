using BurgerShop.Domain.Entities.Finanzas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Finanzas;

public class CierreCajaConfiguration : IEntityTypeConfiguration<CierreCaja>
{
    public void Configure(EntityTypeBuilder<CierreCaja> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.MontoInicial)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(c => c.MontoFinal)
            .HasColumnType("decimal(18,2)");

        builder.Property(c => c.Observaciones)
            .HasMaxLength(1000);

        builder.HasIndex(c => c.Estado);
        builder.HasIndex(c => c.FechaApertura);
    }
}
