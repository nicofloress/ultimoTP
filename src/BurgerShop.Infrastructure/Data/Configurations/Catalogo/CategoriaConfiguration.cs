using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);

        builder.HasData(
            new Categoria { Id = 1, Nombre = "Hamburguesas", Activa = true },
            new Categoria { Id = 2, Nombre = "Bebidas", Activa = true },
            new Categoria { Id = 3, Nombre = "Acompañamientos", Activa = true },
            new Categoria { Id = 4, Nombre = "Postres", Activa = true }
        );
    }
}
