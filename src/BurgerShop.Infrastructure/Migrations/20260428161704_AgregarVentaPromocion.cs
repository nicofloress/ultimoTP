using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarVentaPromocion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DescuentoPromociones",
                table: "Ventas",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ReintegroPromociones",
                table: "Ventas",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "VentaPromociones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VentaId = table.Column<int>(type: "integer", nullable: false),
                    PromocionId = table.Column<int>(type: "integer", nullable: false),
                    NombrePromocion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TipoBeneficio = table.Column<int>(type: "integer", nullable: false),
                    MontoDescuento = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MontoReintegro = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    EsReintegro = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VentaPromociones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VentaPromociones_Promociones_PromocionId",
                        column: x => x.PromocionId,
                        principalTable: "Promociones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VentaPromociones_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VentaPromociones_PromocionId",
                table: "VentaPromociones",
                column: "PromocionId");

            migrationBuilder.CreateIndex(
                name: "IX_VentaPromociones_VentaId",
                table: "VentaPromociones",
                column: "VentaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VentaPromociones");

            migrationBuilder.DropColumn(
                name: "DescuentoPromociones",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "ReintegroPromociones",
                table: "Ventas");
        }
    }
}
