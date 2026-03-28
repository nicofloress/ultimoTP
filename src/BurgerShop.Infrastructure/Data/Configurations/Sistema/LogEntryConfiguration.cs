using BurgerShop.Domain.Entities.Sistema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Sistema;

public class LogEntryConfiguration : IEntityTypeConfiguration<LogEntry>
{
    public void Configure(EntityTypeBuilder<LogEntry> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Fecha)
            .IsRequired();

        builder.Property(l => l.Nivel)
            .IsRequired();

        builder.Property(l => l.Origen)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(l => l.Mensaje)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(l => l.StackTrace)
            .HasMaxLength(8000);

        builder.Property(l => l.UsuarioNombre)
            .HasMaxLength(100);

        builder.Property(l => l.Rol)
            .HasMaxLength(50);

        builder.Property(l => l.HttpMethod)
            .HasMaxLength(10);

        builder.Property(l => l.Ruta)
            .HasMaxLength(500);

        builder.Property(l => l.IP)
            .HasMaxLength(50);

        builder.Property(l => l.UserAgent)
            .HasMaxLength(500);

        // Índices para búsquedas frecuentes por fecha, nivel y usuario
        builder.HasIndex(l => l.Fecha);
        builder.HasIndex(l => l.Nivel);
        builder.HasIndex(l => l.UsuarioId);
    }
}
