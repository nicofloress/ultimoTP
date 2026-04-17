using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class PromocionConfiguration : IEntityTypeConfiguration<Promocion>
{
    public void Configure(EntityTypeBuilder<Promocion> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Descripcion)
            .HasMaxLength(500);

        builder.Property(p => p.ValorDescuento)
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.TipoDescuento)
            .IsRequired();

        builder.HasMany(p => p.Items)
            .WithOne(i => i.Promocion)
            .HasForeignKey(i => i.PromocionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Locales)
            .WithOne(l => l.Promocion)
            .HasForeignKey(l => l.PromocionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.TiposVenta)
            .WithOne(tv => tv.Promocion)
            .HasForeignKey(tv => tv.PromocionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PromocionItemConfiguration : IEntityTypeConfiguration<PromocionItem>
{
    public void Configure(EntityTypeBuilder<PromocionItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.PrecioPromo)
            .HasColumnType("decimal(18,2)");

        builder.HasOne(i => i.Producto)
            .WithMany()
            .HasForeignKey(i => i.ProductoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Combo)
            .WithMany()
            .HasForeignKey(i => i.ComboId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class PromocionLocalConfiguration : IEntityTypeConfiguration<PromocionLocal>
{
    public void Configure(EntityTypeBuilder<PromocionLocal> builder)
    {
        // Clave compuesta para la tabla de unión
        builder.HasKey(pl => new { pl.PromocionId, pl.LocalId });

        builder.HasOne(pl => pl.Local)
            .WithMany()
            .HasForeignKey(pl => pl.LocalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PromocionTipoVentaConfiguration : IEntityTypeConfiguration<PromocionTipoVenta>
{
    public void Configure(EntityTypeBuilder<PromocionTipoVenta> builder)
    {
        builder.HasKey(pt => new { pt.PromocionId, pt.TipoVenta });
    }
}
