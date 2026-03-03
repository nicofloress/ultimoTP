using BurgerShop.Domain.Entities.Logistica;
using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class PedidoConfiguration : IEntityTypeConfiguration<Pedido>
{
    public void Configure(EntityTypeBuilder<Pedido> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.NumeroTicket).IsRequired().HasMaxLength(20);
        builder.Property(p => p.NombreCliente).HasMaxLength(200);
        builder.Property(p => p.TelefonoCliente).HasMaxLength(50);
        builder.Property(p => p.DireccionEntrega).HasMaxLength(500);
        builder.Property(p => p.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Descuento).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Total).HasColumnType("decimal(18,2)");
        builder.Property(p => p.NotasEntrega).HasMaxLength(1000);

        builder.HasOne(p => p.Cliente)
            .WithMany(c => c.Pedidos)
            .HasForeignKey(p => p.ClienteId)
            .IsRequired(false);

        builder.HasOne(p => p.Zona)
            .WithMany()
            .HasForeignKey(p => p.ZonaId)
            .IsRequired(false);

        builder.HasOne(p => p.Repartidor)
            .WithMany(r => r.Pedidos)
            .HasForeignKey(p => p.RepartidorId)
            .IsRequired(false);

        builder.HasIndex(p => p.NumeroTicket).IsUnique();
        builder.HasIndex(p => p.FechaCreacion);
        builder.HasIndex(p => p.Estado);
    }
}
