using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModuloInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CodigosAccion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Signo = table.Column<int>(type: "integer", nullable: false),
                    TipoAfectacion = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodigosAccion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Direccion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EsPuntoVenta = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locales", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ArtiStock",
                columns: table => new
                {
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    LocalId = table.Column<int>(type: "integer", nullable: false),
                    IngresoLocal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    EgresoLocal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    VentaLocal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StockFinal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StockMinimo = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    UltimaModificacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EsPuntoVenta = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtiStock", x => new { x.ProductoId, x.LocalId });
                    table.ForeignKey(
                        name: "FK_ArtiStock_Locales_LocalId",
                        column: x => x.LocalId,
                        principalTable: "Locales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArtiStock_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Movimientos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FechaMovimiento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaProceso = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CodigoAccionId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: true),
                    LocalId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PedidoId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movimientos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Movimientos_CodigosAccion_CodigoAccionId",
                        column: x => x.CodigoAccionId,
                        principalTable: "CodigosAccion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Movimientos_Locales_LocalId",
                        column: x => x.LocalId,
                        principalTable: "Locales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Movimientos_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Movimientos_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Movimientos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "CodigosAccion",
                columns: new[] { "Id", "Activo", "Codigo", "Nombre", "Signo", "TipoAfectacion" },
                values: new object[,]
                {
                    { 1, true, "EGR_VTA", "Egreso por Venta", -1, 1 },
                    { 2, true, "ING_VTA", "Ingreso por Venta", 1, 2 },
                    { 3, true, "ING_CMP", "Ingreso por Compra", 1, 1 },
                    { 4, true, "EGR_CMP", "Egreso por Compra", -1, 2 },
                    { 5, true, "EGR_MRM", "Egreso por Merma", -1, 1 },
                    { 6, true, "AJU_POS", "Ajuste Positivo Stock", 1, 1 },
                    { 7, true, "AJU_NEG", "Ajuste Negativo Stock", -1, 1 },
                    { 8, true, "DEV_CLI", "Devolucion Cliente", 1, 1 },
                    { 9, true, "DEV_PRV", "Devolucion a Proveedor", -1, 1 },
                    { 10, true, "ING_TRF", "Ingreso por Transferencia", 1, 1 },
                    { 11, true, "EGR_TRF", "Egreso por Transferencia", -1, 1 },
                    { 12, true, "EGR_CNS", "Egreso por Consumo Interno", -1, 1 }
                });

            migrationBuilder.InsertData(
                table: "Locales",
                columns: new[] { "Id", "Activo", "Direccion", "EsPuntoVenta", "Nombre" },
                values: new object[] { 1, true, null, true, "Local Principal" });

            migrationBuilder.CreateIndex(
                name: "IX_ArtiStock_LocalId",
                table: "ArtiStock",
                column: "LocalId");

            migrationBuilder.CreateIndex(
                name: "IX_CodigosAccion_Codigo",
                table: "CodigosAccion",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_CodigoAccionId",
                table: "Movimientos",
                column: "CodigoAccionId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_FechaMovimiento",
                table: "Movimientos",
                column: "FechaMovimiento");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_FechaProceso",
                table: "Movimientos",
                column: "FechaProceso");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_LocalId",
                table: "Movimientos",
                column: "LocalId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_PedidoId",
                table: "Movimientos",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_ProductoId_LocalId",
                table: "Movimientos",
                columns: new[] { "ProductoId", "LocalId" });

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_UsuarioId",
                table: "Movimientos",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArtiStock");

            migrationBuilder.DropTable(
                name: "Movimientos");

            migrationBuilder.DropTable(
                name: "CodigosAccion");

            migrationBuilder.DropTable(
                name: "Locales");
        }
    }
}
