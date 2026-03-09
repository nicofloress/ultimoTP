using BurgerShop.Domain.Entities.Logistica;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Logistica;

public class MensajeConfiguration : IEntityTypeConfiguration<Mensaje>
{
    public void Configure(EntityTypeBuilder<Mensaje> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Texto).IsRequired().HasMaxLength(1000);
        builder.Property(m => m.FechaEnvio).IsRequired();

        builder.HasOne(m => m.Repartidor)
            .WithMany()
            .HasForeignKey(m => m.RepartidorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.RepartidorId);
        builder.HasIndex(m => new { m.RepartidorId, m.Leido });
    }
}
