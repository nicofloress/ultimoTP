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
            // --- Medias con Aderezo (+ADD) ---
            new Combo { Id = 1,  Nombre = "30 Hamburguesas 69gr Eco C/Pan + ADD",      Descripcion = "Media eco 69gr con pan y aderezo",    Precio = 22000m, Activo = true, CategoriaId = null },
            new Combo { Id = 2,  Nombre = "30 Hamburguesas 80gr Eco C/Pan + ADD",      Descripcion = "Media eco 80gr con pan y aderezo",    Precio = 27000m, Activo = true, CategoriaId = null },
            new Combo { Id = 3,  Nombre = "20 Hamburguesas 110gr Eco C/Pan + ADD",     Descripcion = "Media eco 110gr con pan y aderezo",   Precio = 24000m, Activo = true, CategoriaId = null },
            new Combo { Id = 4,  Nombre = "30 Hamburguesas 80gr Premium C/Pan + ADD",  Descripcion = "Media premium 80gr",                  Precio = 38000m, Activo = true, CategoriaId = null },
            new Combo { Id = 5,  Nombre = "20 Hamburguesas 110gr Premium C/Pan + ADD", Descripcion = "Media premium 110gr",                 Precio = 34000m, Activo = true, CategoriaId = null },
            new Combo { Id = 6,  Nombre = "20 Hamburguesas 120gr Premium C/Pan + ADD", Descripcion = "Media premium 120gr",                 Precio = 40000m, Activo = true, CategoriaId = null },
            new Combo { Id = 7,  Nombre = "12 Hamburguesas 160gr Premium C/Pan + ADD", Descripcion = "Media premium 160gr",                 Precio = 35000m, Activo = true, CategoriaId = null },
            new Combo { Id = 8,  Nombre = "12 Hamburguesas 198gr Premium C/Pan + ADD", Descripcion = "Media premium 198gr",                 Precio = 42000m, Activo = true, CategoriaId = null },

            // --- Bultos cerrados sin Aderezo ---
            new Combo { Id = 9,  Nombre = "60 Hamburguesas 69gr Eco C/Pan",            Descripcion = "Bulto cerrado eco 69gr",              Precio = 38000m, Activo = true, CategoriaId = null },
            new Combo { Id = 10, Nombre = "60 Hamburguesas 80gr Eco C/Pan",            Descripcion = "Bulto cerrado eco 80gr",              Precio = 48000m, Activo = true, CategoriaId = null },
            new Combo { Id = 11, Nombre = "40 Hamburguesas 110gr Eco C/Pan",           Descripcion = "Bulto cerrado eco 110gr",             Precio = 44000m, Activo = true, CategoriaId = null },
            new Combo { Id = 12, Nombre = "60 Hamburguesas 80gr Premium C/Pan",        Descripcion = "Bulto cerrado premium 80gr",          Precio = 72000m, Activo = true, CategoriaId = null },
            new Combo { Id = 13, Nombre = "40 Hamburguesas 110gr Premium C/Pan",       Descripcion = "Bulto cerrado premium 110gr",         Precio = 64000m, Activo = true, CategoriaId = null },
            new Combo { Id = 14, Nombre = "40 Hamburguesas 120gr Premium C/Pan",       Descripcion = "Bulto cerrado premium 120gr",         Precio = 76000m, Activo = true, CategoriaId = null },
            new Combo { Id = 15, Nombre = "24 Hamburguesas 160gr Premium C/Pan",       Descripcion = "Bulto cerrado premium 160gr",         Precio = 65000m, Activo = true, CategoriaId = null },
            new Combo { Id = 16, Nombre = "24 Hamburguesas 198gr Premium C/Pan",       Descripcion = "Bulto cerrado premium 198gr",         Precio = 80000m, Activo = true, CategoriaId = null },

            // --- 55gr (bulto cerrado, revendedores) ---
            new Combo { Id = 17, Nombre = "72 Hamburguesas 55gr Eco C/Pan",            Descripcion = "Bulto 55gr con pan tradicional",      Precio = 32000m, Activo = true, CategoriaId = null },
            new Combo { Id = 18, Nombre = "72 Hamburguesas 55gr Eco S/Pan",            Descripcion = "Bulto 55gr sin pan ni aderezo",       Precio = 26000m, Activo = true, CategoriaId = null },

            // --- Combos Panchos ---
            new Combo { Id = 19, Nombre = "30 Panchos C/Pan + ADD",                   Descripcion = "Media salchicha corta",               Precio = 18000m, Activo = true, CategoriaId = null },
            new Combo { Id = 20, Nombre = "60 Panchos C/Pan + ADD",                   Descripcion = "Bulto salchicha corta",               Precio = 32000m, Activo = true, CategoriaId = null },
            new Combo { Id = 21, Nombre = "36 Super Panchos C/Pan + ADD",             Descripcion = "Media salchicha larga",               Precio = 28000m, Activo = true, CategoriaId = null },
            new Combo { Id = 22, Nombre = "60 Super Panchos C/Pan + ADD",             Descripcion = "Bulto salchicha larga",               Precio = 45000m, Activo = true, CategoriaId = null }
        );
    }
}
