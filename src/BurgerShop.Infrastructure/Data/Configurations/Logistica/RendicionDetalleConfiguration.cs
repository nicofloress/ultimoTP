using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class RendicionDetalleConfiguration : IEntityTypeConfiguration<RendicionDetalle>
{
    public void Configure(EntityTypeBuilder<RendicionDetalle> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Total)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(d => d.NumeroTicket)
            .HasMaxLength(50);

        builder.Property(d => d.Estado)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.FormaPago)
            .HasMaxLength(100);

        builder.HasOne(d => d.Rendicion)
            .WithMany(r => r.Detalles)
            .HasForeignKey(d => d.RendicionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Pedido)
            .WithMany()
            .HasForeignKey(d => d.PedidoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
