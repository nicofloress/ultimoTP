using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmpresaEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Locales",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Empresas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RazonSocial = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NombreFantasia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Cuit = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    CondicionIva = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DireccionFiscal = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Localidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Provincia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CodigoPostal = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IngresosBrutos = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    InicioActividades = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    PuntoVenta = table.Column<int>(type: "integer", nullable: true),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empresas", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Locales",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Locales_EmpresaId",
                table: "Locales",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Cuit",
                table: "Empresas",
                column: "Cuit",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Locales_Empresas_EmpresaId",
                table: "Locales",
                column: "EmpresaId",
                principalTable: "Empresas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Locales_Empresas_EmpresaId",
                table: "Locales");

            migrationBuilder.DropTable(
                name: "Empresas");

            migrationBuilder.DropIndex(
                name: "IX_Locales_EmpresaId",
                table: "Locales");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Locales");
        }
    }
}
