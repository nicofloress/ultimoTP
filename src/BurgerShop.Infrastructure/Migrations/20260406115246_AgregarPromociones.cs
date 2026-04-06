using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarPromociones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Promociones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaDesde = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaHasta = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    TipoDescuento = table.Column<int>(type: "integer", nullable: false),
                    ValorDescuento = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promociones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PromocionItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PromocionId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: true),
                    ComboId = table.Column<int>(type: "integer", nullable: true),
                    PrecioPromo = table.Column<decimal>(type: "numeric(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromocionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromocionItems_Combos_ComboId",
                        column: x => x.ComboId,
                        principalTable: "Combos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PromocionItems_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PromocionItems_Promociones_PromocionId",
                        column: x => x.PromocionId,
                        principalTable: "Promociones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PromocionLocales",
                columns: table => new
                {
                    PromocionId = table.Column<int>(type: "integer", nullable: false),
                    LocalId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromocionLocales", x => new { x.PromocionId, x.LocalId });
                    table.ForeignKey(
                        name: "FK_PromocionLocales_Locales_LocalId",
                        column: x => x.LocalId,
                        principalTable: "Locales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PromocionLocales_Promociones_PromocionId",
                        column: x => x.PromocionId,
                        principalTable: "Promociones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromocionItems_ComboId",
                table: "PromocionItems",
                column: "ComboId");

            migrationBuilder.CreateIndex(
                name: "IX_PromocionItems_ProductoId",
                table: "PromocionItems",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_PromocionItems_PromocionId",
                table: "PromocionItems",
                column: "PromocionId");

            migrationBuilder.CreateIndex(
                name: "IX_PromocionLocales_LocalId",
                table: "PromocionLocales",
                column: "LocalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromocionItems");

            migrationBuilder.DropTable(
                name: "PromocionLocales");

            migrationBuilder.DropTable(
                name: "Promociones");
        }
    }
}
