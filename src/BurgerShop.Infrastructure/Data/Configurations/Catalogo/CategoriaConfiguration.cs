using BurgerShop.Domain.Entities.Catalogo;
using BurgerShop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);

        // Relación self-referencing: una categoría puede tener una categoría padre
        builder.HasOne(c => c.CategoriaPadre)
            .WithMany(c => c.SubCategorias)
            .HasForeignKey(c => c.CategoriaPadreId)
            .IsRequired(false);

        builder.HasData(
            // --- Categorías padre (raíz) ---
            new Categoria { Id = 17, Nombre = "Económica", Activa = true, SeccionCamioneta = SeccionCamioneta.Ninguno, CategoriaPadreId = null },
            new Categoria { Id = 18, Nombre = "Premium",   Activa = true, SeccionCamioneta = SeccionCamioneta.Ninguno, CategoriaPadreId = null },

            // --- Hamburguesas Económicas (hijas de Id=17) ---
            new Categoria { Id = 1,  Nombre = "Hamburguesa Económica 55gr",  Activa = true, SeccionCamioneta = SeccionCamioneta.MedallonEconomico, CategoriaPadreId = 17 },
            new Categoria { Id = 2,  Nombre = "Hamburguesa Económica 69gr",  Activa = true, SeccionCamioneta = SeccionCamioneta.MedallonEconomico, CategoriaPadreId = 17 },
            new Categoria { Id = 3,  Nombre = "Hamburguesa Económica 80gr",  Activa = true, SeccionCamioneta = SeccionCamioneta.MedallonEconomico, CategoriaPadreId = 17 },
            new Categoria { Id = 4,  Nombre = "Hamburguesa Económica 110gr", Activa = true, SeccionCamioneta = SeccionCamioneta.MedallonEconomico, CategoriaPadreId = 17 },

            // --- Hamburguesas Premium (hijas de Id=18) ---
            new Categoria { Id = 5,  Nombre = "Hamburguesa Premium 80gr",    Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium, CategoriaPadreId = 18 },
            new Categoria { Id = 6,  Nombre = "Hamburguesa Premium 110gr",   Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium, CategoriaPadreId = 18 },
            new Categoria { Id = 7,  Nombre = "Hamburguesa Premium 120gr",   Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium, CategoriaPadreId = 18 },
            new Categoria { Id = 8,  Nombre = "Hamburguesa Premium 160gr",   Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium, CategoriaPadreId = 18 },
            new Categoria { Id = 9,  Nombre = "Hamburguesa Premium 198gr",   Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium, CategoriaPadreId = 18 },

            // --- Salchichas, Panes, Aderezos (sin categoría padre) ---
            new Categoria { Id = 10, Nombre = "Salchicha Corta",             Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaCorta,     CategoriaPadreId = null },
            new Categoria { Id = 11, Nombre = "Salchicha Larga",             Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaLarga,     CategoriaPadreId = null },
            new Categoria { Id = 12, Nombre = "Pan Tradicional",             Activa = true, SeccionCamioneta = SeccionCamioneta.PanTradicional,     CategoriaPadreId = null },
            new Categoria { Id = 13, Nombre = "Pan Maxi",                    Activa = true, SeccionCamioneta = SeccionCamioneta.PanMaxi,            CategoriaPadreId = null },
            new Categoria { Id = 14, Nombre = "Pan Pancho",                  Activa = true, SeccionCamioneta = SeccionCamioneta.PanPancho,          CategoriaPadreId = null },
            new Categoria { Id = 15, Nombre = "Pan Super Pancho",            Activa = true, SeccionCamioneta = SeccionCamioneta.PanSuperPancho,     CategoriaPadreId = null },
            new Categoria { Id = 16, Nombre = "Aderezos",                    Activa = true, SeccionCamioneta = SeccionCamioneta.Aderezo,            CategoriaPadreId = null }
        );
    }
}
