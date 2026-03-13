using BurgerShop.Domain.Entities.Catalogo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Catalogo;

public class ComboDetalleConfiguration : IEntityTypeConfiguration<ComboDetalle>
{
    public void Configure(EntityTypeBuilder<ComboDetalle> builder)
    {
        builder.HasKey(cd => new { cd.ComboId, cd.ProductoId });

        builder.HasOne(cd => cd.Combo)
            .WithMany(c => c.Detalles)
            .HasForeignKey(cd => cd.ComboId);

        builder.HasOne(cd => cd.Producto)
            .WithMany(p => p.ComboDetalles)
            .HasForeignKey(cd => cd.ProductoId);

        builder.HasData(
            // --- Combo 1: 30 Hamburguesas 69gr Eco C/Pan + ADD ---
            // Medallón: Eco 69gr (Id=2), x30 | Pan: Tradicional (Id=12), x30 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 1, ProductoId = 2,  Cantidad = 30 },
            new ComboDetalle { ComboId = 1, ProductoId = 12, Cantidad = 30 },
            new ComboDetalle { ComboId = 1, ProductoId = 16, Cantidad = 1  },

            // --- Combo 2: 30 Hamburguesas 80gr Eco C/Pan + ADD ---
            // Medallón: Eco 80gr (Id=3), x30 | Pan: Tradicional (Id=12), x30 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 2, ProductoId = 3,  Cantidad = 30 },
            new ComboDetalle { ComboId = 2, ProductoId = 12, Cantidad = 30 },
            new ComboDetalle { ComboId = 2, ProductoId = 16, Cantidad = 1  },

            // --- Combo 3: 20 Hamburguesas 110gr Eco C/Pan + ADD ---
            // Medallón: Eco 110gr (Id=4), x20 | Pan: Maxi (Id=13), x20 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 3, ProductoId = 4,  Cantidad = 20 },
            new ComboDetalle { ComboId = 3, ProductoId = 13, Cantidad = 20 },
            new ComboDetalle { ComboId = 3, ProductoId = 16, Cantidad = 1  },

            // --- Combo 4: 30 Hamburguesas 80gr Premium C/Pan + ADD ---
            // Medallón: Premium 80gr (Id=5), x30 | Pan: Tradicional (Id=12), x30 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 4, ProductoId = 5,  Cantidad = 30 },
            new ComboDetalle { ComboId = 4, ProductoId = 12, Cantidad = 30 },
            new ComboDetalle { ComboId = 4, ProductoId = 16, Cantidad = 1  },

            // --- Combo 5: 20 Hamburguesas 110gr Premium C/Pan + ADD ---
            // Medallón: Premium 110gr (Id=6), x20 | Pan: Maxi (Id=13), x20 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 5, ProductoId = 6,  Cantidad = 20 },
            new ComboDetalle { ComboId = 5, ProductoId = 13, Cantidad = 20 },
            new ComboDetalle { ComboId = 5, ProductoId = 16, Cantidad = 1  },

            // --- Combo 6: 20 Hamburguesas 120gr Premium C/Pan + ADD ---
            // Medallón: Premium 120gr (Id=7), x20 | Pan: Maxi (Id=13), x20 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 6, ProductoId = 7,  Cantidad = 20 },
            new ComboDetalle { ComboId = 6, ProductoId = 13, Cantidad = 20 },
            new ComboDetalle { ComboId = 6, ProductoId = 16, Cantidad = 1  },

            // --- Combo 7: 12 Hamburguesas 160gr Premium C/Pan + ADD ---
            // Medallón: Premium 160gr (Id=8), x12 | Pan: Maxi (Id=13), x12 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 7, ProductoId = 8,  Cantidad = 12 },
            new ComboDetalle { ComboId = 7, ProductoId = 13, Cantidad = 12 },
            new ComboDetalle { ComboId = 7, ProductoId = 16, Cantidad = 1  },

            // --- Combo 8: 12 Hamburguesas 198gr Premium C/Pan + ADD ---
            // Medallón: Premium 198gr (Id=9), x12 | Pan: Maxi (Id=13), x12 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 8, ProductoId = 9,  Cantidad = 12 },
            new ComboDetalle { ComboId = 8, ProductoId = 13, Cantidad = 12 },
            new ComboDetalle { ComboId = 8, ProductoId = 16, Cantidad = 1  },

            // --- Combo 9: 60 Hamburguesas 69gr Eco C/Pan ---
            // Medallón: Eco 69gr (Id=2), x60 | Pan: Tradicional (Id=12), x60
            new ComboDetalle { ComboId = 9, ProductoId = 2,  Cantidad = 60 },
            new ComboDetalle { ComboId = 9, ProductoId = 12, Cantidad = 60 },

            // --- Combo 10: 60 Hamburguesas 80gr Eco C/Pan ---
            // Medallón: Eco 80gr (Id=3), x60 | Pan: Tradicional (Id=12), x60
            new ComboDetalle { ComboId = 10, ProductoId = 3,  Cantidad = 60 },
            new ComboDetalle { ComboId = 10, ProductoId = 12, Cantidad = 60 },

            // --- Combo 11: 40 Hamburguesas 110gr Eco C/Pan ---
            // Medallón: Eco 110gr (Id=4), x40 | Pan: Maxi (Id=13), x40
            new ComboDetalle { ComboId = 11, ProductoId = 4,  Cantidad = 40 },
            new ComboDetalle { ComboId = 11, ProductoId = 13, Cantidad = 40 },

            // --- Combo 12: 60 Hamburguesas 80gr Premium C/Pan ---
            // Medallón: Premium 80gr (Id=5), x60 | Pan: Tradicional (Id=12), x60
            new ComboDetalle { ComboId = 12, ProductoId = 5,  Cantidad = 60 },
            new ComboDetalle { ComboId = 12, ProductoId = 12, Cantidad = 60 },

            // --- Combo 13: 40 Hamburguesas 110gr Premium C/Pan ---
            // Medallón: Premium 110gr (Id=6), x40 | Pan: Maxi (Id=13), x40
            new ComboDetalle { ComboId = 13, ProductoId = 6,  Cantidad = 40 },
            new ComboDetalle { ComboId = 13, ProductoId = 13, Cantidad = 40 },

            // --- Combo 14: 40 Hamburguesas 120gr Premium C/Pan ---
            // Medallón: Premium 120gr (Id=7), x40 | Pan: Maxi (Id=13), x40
            new ComboDetalle { ComboId = 14, ProductoId = 7,  Cantidad = 40 },
            new ComboDetalle { ComboId = 14, ProductoId = 13, Cantidad = 40 },

            // --- Combo 15: 24 Hamburguesas 160gr Premium C/Pan ---
            // Medallón: Premium 160gr (Id=8), x24 | Pan: Maxi (Id=13), x24
            new ComboDetalle { ComboId = 15, ProductoId = 8,  Cantidad = 24 },
            new ComboDetalle { ComboId = 15, ProductoId = 13, Cantidad = 24 },

            // --- Combo 16: 24 Hamburguesas 198gr Premium C/Pan ---
            // Medallón: Premium 198gr (Id=9), x24 | Pan: Maxi (Id=13), x24
            new ComboDetalle { ComboId = 16, ProductoId = 9,  Cantidad = 24 },
            new ComboDetalle { ComboId = 16, ProductoId = 13, Cantidad = 24 },

            // --- Combo 17: 72 Hamburguesas 55gr Eco C/Pan ---
            // Medallón: Eco 55gr (Id=1), x72 | Pan: Tradicional (Id=12), x72
            new ComboDetalle { ComboId = 17, ProductoId = 1,  Cantidad = 72 },
            new ComboDetalle { ComboId = 17, ProductoId = 12, Cantidad = 72 },

            // --- Combo 18: 72 Hamburguesas 55gr Eco S/Pan ---
            // Medallón: Eco 55gr (Id=1), x72 (sin pan ni aderezo)
            new ComboDetalle { ComboId = 18, ProductoId = 1,  Cantidad = 72 },

            // --- Combo 19: 30 Panchos C/Pan + ADD ---
            // Salchicha Corta (Id=10), x30 | Pan Pancho (Id=14), x30 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 19, ProductoId = 10, Cantidad = 30 },
            new ComboDetalle { ComboId = 19, ProductoId = 14, Cantidad = 30 },
            new ComboDetalle { ComboId = 19, ProductoId = 16, Cantidad = 1  },

            // --- Combo 20: 60 Panchos C/Pan + ADD ---
            // Salchicha Corta (Id=10), x60 | Pan Pancho (Id=14), x60 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 20, ProductoId = 10, Cantidad = 60 },
            new ComboDetalle { ComboId = 20, ProductoId = 14, Cantidad = 60 },
            new ComboDetalle { ComboId = 20, ProductoId = 16, Cantidad = 1  },

            // --- Combo 21: 36 Super Panchos C/Pan + ADD ---
            // Salchicha Larga (Id=11), x36 | Pan Super Pancho (Id=15), x36 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 21, ProductoId = 11, Cantidad = 36 },
            new ComboDetalle { ComboId = 21, ProductoId = 15, Cantidad = 36 },
            new ComboDetalle { ComboId = 21, ProductoId = 16, Cantidad = 1  },

            // --- Combo 22: 60 Super Panchos C/Pan + ADD ---
            // Salchicha Larga (Id=11), x60 | Pan Super Pancho (Id=15), x60 | Aderezo (Id=16), x1
            new ComboDetalle { ComboId = 22, ProductoId = 11, Cantidad = 60 },
            new ComboDetalle { ComboId = 22, ProductoId = 15, Cantidad = 60 },
            new ComboDetalle { ComboId = 22, ProductoId = 16, Cantidad = 1  }
        );
    }
}
