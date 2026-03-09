using BurgerShop.Domain.Entities.Ventas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Ventas;

public class FormaPagoConfiguration : IEntityTypeConfiguration<FormaPago>
{
    public void Configure(EntityTypeBuilder<FormaPago> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(f => f.PorcentajeRecargo).HasColumnType("decimal(18,2)");

        builder.HasData(
            new FormaPago { Id = 1, Nombre = "Efectivo", PorcentajeRecargo = 0m, Activa = true },
            new FormaPago { Id = 2, Nombre = "MercadoPago Transferencia", PorcentajeRecargo = 0m, Activa = true },
            new FormaPago { Id = 3, Nombre = "Banco Galicia Débito", PorcentajeRecargo = 0m, Activa = true },
            new FormaPago { Id = 4, Nombre = "Banco Galicia Crédito 1 cuota", PorcentajeRecargo = 10m, Activa = true },
            new FormaPago { Id = 5, Nombre = "Banco Galicia Crédito 2 cuotas", PorcentajeRecargo = 20m, Activa = true },
            new FormaPago { Id = 6, Nombre = "Banco Galicia Crédito 3 cuotas", PorcentajeRecargo = 30m, Activa = true }
        );
    }
}
