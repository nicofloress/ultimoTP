using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class LineaPedidoConfiguration : IEntityTypeConfiguration<LineaPedido>
{
    public void Configure(EntityTypeBuilder<LineaPedido> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Descripcion).IsRequired().HasMaxLength(200);
        builder.Property(l => l.PrecioUnitario).HasColumnType("decimal(18,2)");
        builder.Property(l => l.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(l => l.Notas).HasMaxLength(500);

        builder.HasOne(l => l.Pedido)
            .WithMany(p => p.Lineas)
            .HasForeignKey(l => l.PedidoId);

        builder.HasOne(l => l.Producto)
            .WithMany()
            .HasForeignKey(l => l.ProductoId)
            .IsRequired(false);

        builder.HasOne(l => l.Combo)
            .WithMany()
            .HasForeignKey(l => l.ComboId)
            .IsRequired(false);
    }
}
