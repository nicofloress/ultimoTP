using BurgerShop.Domain.Entities.Finanzas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Finanzas;

public class CierreCajaDetalleConfiguration : IEntityTypeConfiguration<CierreCajaDetalle>
{
    public void Configure(EntityTypeBuilder<CierreCajaDetalle> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.MontoTotal)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.HasOne(d => d.CierreCaja)
            .WithMany(c => c.Detalles)
            .HasForeignKey(d => d.CierreCajaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.FormaPago)
            .WithMany()
            .HasForeignKey(d => d.FormaPagoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
