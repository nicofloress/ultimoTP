using BurgerShop.Domain.Entities.Inventario;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Inventario;

public class MovimientoConfiguration : IEntityTypeConfiguration<Movimiento>
{
    public void Configure(EntityTypeBuilder<Movimiento> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Cantidad)
            .HasColumnType("decimal(18,2)");

        builder.Property(m => m.PrecioUnitario)
            .HasColumnType("decimal(18,2)");

        builder.Property(m => m.MontoTotal)
            .HasColumnType("decimal(18,2)");

        builder.Property(m => m.Observaciones)
            .HasMaxLength(500);

        // CodigoAccion — requerido, no se puede borrar si tiene movimientos
        builder.HasOne(m => m.CodigoAccion)
            .WithMany()
            .HasForeignKey(m => m.CodigoAccionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Producto — opcional, se desvincula si se borra el producto
        builder.HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Local — requerido, no se puede borrar si tiene movimientos
        builder.HasOne(m => m.Local)
            .WithMany()
            .HasForeignKey(m => m.LocalId)
            .OnDelete(DeleteBehavior.Restrict);

        // Venta — opcional, se desvincula si se borra la venta
        builder.HasOne(m => m.Venta)
            .WithMany()
            .HasForeignKey(m => m.VentaId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Usuario — opcional, se desvincula si se borra el usuario
        builder.HasOne(m => m.Usuario)
            .WithMany()
            .HasForeignKey(m => m.UsuarioId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(m => m.FechaMovimiento);
        builder.HasIndex(m => m.FechaProceso);
        builder.HasIndex(m => m.CodigoAccionId);
        builder.HasIndex(m => m.LocalId);
        builder.HasIndex(m => new { m.ProductoId, m.LocalId });
    }
}
