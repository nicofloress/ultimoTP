using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarHistorialPrecios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HistorialPrecios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TipoEntidad = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EntidadId = table.Column<int>(type: "integer", nullable: false),
                    NombreEntidad = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PrecioAnterior = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PrecioNuevo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FechaCambio = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UsuarioNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistorialPrecios", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HistorialPrecios_FechaCambio",
                table: "HistorialPrecios",
                column: "FechaCambio");

            migrationBuilder.CreateIndex(
                name: "IX_HistorialPrecios_TipoEntidad_EntidadId",
                table: "HistorialPrecios",
                columns: new[] { "TipoEntidad", "EntidadId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistorialPrecios");
        }
    }
}
