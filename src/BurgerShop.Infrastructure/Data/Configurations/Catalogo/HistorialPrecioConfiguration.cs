using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class HistorialPrecioConfiguration : IEntityTypeConfiguration<HistorialPrecio>
{
    public void Configure(EntityTypeBuilder<HistorialPrecio> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.TipoEntidad).IsRequired().HasMaxLength(20);
        builder.Property(h => h.NombreEntidad).HasMaxLength(200);
        builder.Property(h => h.PrecioAnterior).HasColumnType("decimal(18,2)");
        builder.Property(h => h.PrecioNuevo).HasColumnType("decimal(18,2)");
        builder.Property(h => h.UsuarioNombre).HasMaxLength(150);
        builder.HasIndex(h => new { h.TipoEntidad, h.EntidadId });
        builder.HasIndex(h => h.FechaCambio);
    }
}
