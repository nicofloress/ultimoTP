using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ListaPrecioConfiguration : IEntityTypeConfiguration<ListaPrecio>
{
    public void Configure(EntityTypeBuilder<ListaPrecio> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Nombre).IsRequired().HasMaxLength(200);

        builder.HasIndex(l => l.Nombre).IsUnique();
    }
}
