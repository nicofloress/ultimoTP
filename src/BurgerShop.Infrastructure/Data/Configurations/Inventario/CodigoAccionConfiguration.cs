using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurgerShop.Infrastructure.Data.Configurations.Inventario;

public class CodigoAccionConfiguration : IEntityTypeConfiguration<CodigoAccion>
{
    public void Configure(EntityTypeBuilder<CodigoAccion> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Codigo).IsRequired().HasMaxLength(10);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);

        builder.HasIndex(c => c.Codigo).IsUnique();

        builder.HasData(
            new CodigoAccion { Id = 1,  Codigo = "EGR_VTA", Nombre = "Egreso por Venta",              Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 2,  Codigo = "ING_VTA", Nombre = "Ingreso por Venta",              Signo =  1, TipoAfectacion = TipoAfectacion.Caja,  Activo = true },
            new CodigoAccion { Id = 3,  Codigo = "ING_CMP", Nombre = "Ingreso por Compra",             Signo =  1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 4,  Codigo = "EGR_CMP", Nombre = "Egreso por Compra",              Signo = -1, TipoAfectacion = TipoAfectacion.Caja,  Activo = true },
            new CodigoAccion { Id = 5,  Codigo = "EGR_MRM", Nombre = "Egreso por Merma",               Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 6,  Codigo = "AJU_POS", Nombre = "Ajuste Positivo Stock",          Signo =  1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 7,  Codigo = "AJU_NEG", Nombre = "Ajuste Negativo Stock",          Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 8,  Codigo = "DEV_CLI", Nombre = "Devolucion Cliente",             Signo =  1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 9,  Codigo = "DEV_PRV", Nombre = "Devolucion a Proveedor",         Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 10, Codigo = "ING_TRF", Nombre = "Ingreso por Transferencia",      Signo =  1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 11, Codigo = "EGR_TRF", Nombre = "Egreso por Transferencia",       Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true },
            new CodigoAccion { Id = 12, Codigo = "EGR_CNS", Nombre = "Egreso por Consumo Interno",     Signo = -1, TipoAfectacion = TipoAfectacion.Stock, Activo = true }
        );
    }
}
