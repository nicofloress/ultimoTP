using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class PagoPedidoConfiguration : IEntityTypeConfiguration<PagoPedido>
{
    public void Configure(EntityTypeBuilder<PagoPedido> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Monto).HasColumnType("decimal(18,2)");
        builder.Property(p => p.PorcentajeRecargo).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Recargo).HasColumnType("decimal(18,2)");
        builder.Property(p => p.TotalACobrar).HasColumnType("decimal(18,2)");

        builder.HasOne(p => p.Pedido)
            .WithMany(ped => ped.Pagos)
            .HasForeignKey(p => p.PedidoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.FormaPago)
            .WithMany()
            .HasForeignKey(p => p.FormaPagoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
