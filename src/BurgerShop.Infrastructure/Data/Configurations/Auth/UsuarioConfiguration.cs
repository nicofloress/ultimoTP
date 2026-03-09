using BurgerShop.Domain.Entities.Auth;
using BurgerShop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Auth;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    private const string AdminHash = "$2a$11$kU/EX5XSqZjkxGiq0vjhFOnj6.k2QosL/YfjYTAJKRMQIz9NuHWhK";
    private const string LocalHash = "$2a$11$0pKoaFrCbKlj/IQINhN4pumdQ550SnejahxpjBg.MLgbuTtKCufAa";
    private const string Rep1Hash = "$2a$11$GP5TV.wofKMCcswZFsFBHOvsLJ83PqGveVQ4bcUO9FuY4V9N54Mwi";
    private const string Rep2Hash = "$2a$11$W8Sz4uInizUbeN7QyFxus.yY5OeJjg1FpWxkbaweuNyzCipCAF87u";

    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.NombreUsuario)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(u => u.NombreUsuario)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.NombreCompleto)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Rol)
            .IsRequired()
            .HasConversion<string>();

        builder.HasOne(u => u.Repartidor)
            .WithMany()
            .HasForeignKey(u => u.RepartidorId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasData(
            new Usuario
            {
                Id = 1,
                NombreUsuario = "admin",
                PasswordHash = AdminHash,
                NombreCompleto = "Administrador del Sistema",
                Rol = RolUsuario.Administrador,
                RepartidorId = null,
                Activo = true
            },
            new Usuario
            {
                Id = 2,
                NombreUsuario = "local",
                PasswordHash = LocalHash,
                NombreCompleto = "Operador Local",
                Rol = RolUsuario.Local,
                RepartidorId = null,
                Activo = true
            },
            new Usuario
            {
                Id = 3,
                NombreUsuario = "repartidor1",
                PasswordHash = Rep1Hash,
                NombreCompleto = "Juan Pérez",
                Rol = RolUsuario.Repartidor,
                RepartidorId = 1,
                Activo = true
            },
            new Usuario
            {
                Id = 4,
                NombreUsuario = "repartidor2",
                PasswordHash = Rep2Hash,
                NombreCompleto = "María García",
                Rol = RolUsuario.Repartidor,
                RepartidorId = 2,
                Activo = true
            }
        );
    }
}
