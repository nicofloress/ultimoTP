using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ComboConfiguration : IEntityTypeConfiguration<Combo>
{
    public void Configure(EntityTypeBuilder<Combo> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(c => c.Descripcion).HasMaxLength(500);
        builder.Property(c => c.Precio).HasColumnType("decimal(18,2)");

        builder.HasOne(c => c.Categoria)
            .WithMany()
            .HasForeignKey(c => c.CategoriaId)
            .IsRequired(false);

        builder.HasData(
            // Todos los combos pertenecen a Cat 17 - Ofertas Semanales
            new Combo { Id = 1, Nombre = "Promo 40 Hamburguesas + Pan", Descripcion = "40 hamburguesas 110gr + 40 panes", Precio = 3700m, Activo = true, CategoriaId = 17 },
            new Combo { Id = 2, Nombre = "Promo 30 Hamburguesas + Pan", Descripcion = "30 hamburguesas 69gr + 30 panes",  Precio = 2700m, Activo = true, CategoriaId = 17 },
            new Combo { Id = 3, Nombre = "Promo 30 Panchos",            Descripcion = "30 panchos + 30 panes",            Precio = 1900m, Activo = true, CategoriaId = 17 },
            new Combo { Id = 4, Nombre = "Promo 18 Super Panchos",      Descripcion = "18 super panchos + 18 panes",      Precio = 1600m, Activo = true, CategoriaId = 17 },
            new Combo { Id = 5, Nombre = "Promo 36 Super Panchos",      Descripcion = "36 super panchos + 36 panes",      Precio = 2950m, Activo = true, CategoriaId = 17 }
        );
    }
}
