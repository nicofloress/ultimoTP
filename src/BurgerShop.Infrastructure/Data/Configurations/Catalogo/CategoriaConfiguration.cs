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

        builder.HasData(
            new Categoria { Id = 1,  Nombre = "Hamburguesas",          Activa = true, SeccionCamioneta = SeccionCamioneta.MedallonEconomico },
            new Categoria { Id = 2,  Nombre = "Maxi Hamburguesas",     Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium },
            new Categoria { Id = 3,  Nombre = "Super Hamburguesas",    Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium },
            new Categoria { Id = 4,  Nombre = "Mega Hamburguesas",     Activa = true, SeccionCamioneta = SeccionCamioneta.HamburguesaPremium },
            new Categoria { Id = 5,  Nombre = "Pan Hamburguesa",       Activa = true, SeccionCamioneta = SeccionCamioneta.PanTradicional },
            new Categoria { Id = 6,  Nombre = "Pan Maxi Hamburguesa",  Activa = true, SeccionCamioneta = SeccionCamioneta.PanMaxi },
            new Categoria { Id = 7,  Nombre = "Panchos",               Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaCorta },
            new Categoria { Id = 8,  Nombre = "Salchichas",            Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaCorta },
            new Categoria { Id = 9,  Nombre = "Pan Pancho",            Activa = true, SeccionCamioneta = SeccionCamioneta.PanPancho },
            new Categoria { Id = 10, Nombre = "Super Panchos",         Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaLarga },
            new Categoria { Id = 11, Nombre = "Salchichas Largas",     Activa = true, SeccionCamioneta = SeccionCamioneta.SalchichaLarga },
            new Categoria { Id = 12, Nombre = "Pan Super Pancho",      Activa = true, SeccionCamioneta = SeccionCamioneta.PanSuperPancho },
            new Categoria { Id = 13, Nombre = "Aderezos",              Activa = true, SeccionCamioneta = SeccionCamioneta.Aderezo },
            new Categoria { Id = 14, Nombre = "Snacks",                Activa = true, SeccionCamioneta = SeccionCamioneta.Otro },
            new Categoria { Id = 15, Nombre = "Congelados",            Activa = true, SeccionCamioneta = SeccionCamioneta.Otro },
            new Categoria { Id = 16, Nombre = "Bebidas",               Activa = true, SeccionCamioneta = SeccionCamioneta.Otro },
            new Categoria { Id = 17, Nombre = "Ofertas Semanales",     Activa = true, SeccionCamioneta = SeccionCamioneta.Ninguno }
        );
    }
}
