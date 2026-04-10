using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertirUnidadesAPaquetes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // Conversión de unidades individuales a paquetes
            // UnidadMinima indica cuántas unidades reales tiene cada paquete
            // (hamburguesas=2, salchichas=6, panes=4/6)
            //
            // UnidadesPorBulto y UnidadesPorMedia estaban en unidades reales,
            // ahora pasan a estar en paquetes.
            // ============================================================

            // 1. Convertir UnidadesPorBulto y UnidadesPorMedia de productos
            migrationBuilder.Sql(@"
                UPDATE ""Productos""
                SET ""UnidadesPorBulto"" = ""UnidadesPorBulto"" / ""UnidadMinima"",
                    ""UnidadesPorMedia"" = CASE
                        WHEN ""UnidadesPorMedia"" > 0 THEN ""UnidadesPorMedia"" / ""UnidadMinima""
                        ELSE 0
                    END
                WHERE ""UnidadMinima"" > 1;
            ");

            // 2. Convertir ComboDetalle.Cantidad (estaba en unidades reales, ahora en paquetes)
            migrationBuilder.Sql(@"
                UPDATE ""ComboDetalles"" cd
                SET ""Cantidad"" = cd.""Cantidad"" / p.""UnidadMinima""
                FROM ""Productos"" p
                WHERE cd.""ProductoId"" = p.""Id"" AND p.""UnidadMinima"" > 1;
            ");

            // 3. Convertir ArtiStock existente (estaba en unidades reales, ahora en paquetes)
            migrationBuilder.Sql(@"
                UPDATE ""ArtiStock"" a
                SET ""IngresoLocal"" = a.""IngresoLocal"" / p.""UnidadMinima"",
                    ""EgresoLocal"" = a.""EgresoLocal"" / p.""UnidadMinima"",
                    ""VentaLocal"" = a.""VentaLocal"" / p.""UnidadMinima"",
                    ""StockFinal"" = a.""StockFinal"" / p.""UnidadMinima"",
                    ""StockMinimo"" = CASE
                        WHEN a.""StockMinimo"" IS NOT NULL THEN a.""StockMinimo"" / p.""UnidadMinima""
                        ELSE NULL
                    END
                FROM ""Productos"" p
                WHERE a.""ProductoId"" = p.""Id"" AND p.""UnidadMinima"" > 1;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revertir: multiplicar de vuelta por UnidadMinima
            migrationBuilder.Sql(@"
                UPDATE ""Productos""
                SET ""UnidadesPorBulto"" = ""UnidadesPorBulto"" * ""UnidadMinima"",
                    ""UnidadesPorMedia"" = CASE
                        WHEN ""UnidadesPorMedia"" > 0 THEN ""UnidadesPorMedia"" * ""UnidadMinima""
                        ELSE 0
                    END
                WHERE ""UnidadMinima"" > 1;

                UPDATE ""ComboDetalles"" cd
                SET ""Cantidad"" = cd.""Cantidad"" * p.""UnidadMinima""
                FROM ""Productos"" p
                WHERE cd.""ProductoId"" = p.""Id"" AND p.""UnidadMinima"" > 1;

                UPDATE ""ArtiStock"" a
                SET ""IngresoLocal"" = a.""IngresoLocal"" * p.""UnidadMinima"",
                    ""EgresoLocal"" = a.""EgresoLocal"" * p.""UnidadMinima"",
                    ""VentaLocal"" = a.""VentaLocal"" * p.""UnidadMinima"",
                    ""StockFinal"" = a.""StockFinal"" * p.""UnidadMinima"",
                    ""StockMinimo"" = CASE
                        WHEN a.""StockMinimo"" IS NOT NULL THEN a.""StockMinimo"" * p.""UnidadMinima""
                        ELSE NULL
                    END
                FROM ""Productos"" p
                WHERE a.""ProductoId"" = p.""Id"" AND p.""UnidadMinima"" > 1;
            ");
        }
    }
}
