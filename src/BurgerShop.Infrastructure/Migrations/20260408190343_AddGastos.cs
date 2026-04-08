using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGastos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Repartidores_CodigoAcceso",
                table: "Repartidores");

            migrationBuilder.AlterColumn<string>(
                name: "CodigoAcceso",
                table: "Repartidores",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.CreateTable(
                name: "Gastos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FechaGasto = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Categoria = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Proveedor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Etiqueta = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FormaPagoId = table.Column<int>(type: "integer", nullable: true),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Iva = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Deuda = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Pagado = table.Column<bool>(type: "boolean", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    LocalId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gastos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Gastos_FormasPago_FormaPagoId",
                        column: x => x.FormaPagoId,
                        principalTable: "FormasPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Gastos_Locales_LocalId",
                        column: x => x.LocalId,
                        principalTable: "Locales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Repartidores_CodigoAcceso",
                table: "Repartidores",
                column: "CodigoAcceso",
                unique: true,
                filter: "\"CodigoAcceso\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Gastos_Activo",
                table: "Gastos",
                column: "Activo");

            migrationBuilder.CreateIndex(
                name: "IX_Gastos_FechaGasto",
                table: "Gastos",
                column: "FechaGasto");

            migrationBuilder.CreateIndex(
                name: "IX_Gastos_FormaPagoId",
                table: "Gastos",
                column: "FormaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Gastos_LocalId",
                table: "Gastos",
                column: "LocalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Gastos");

            migrationBuilder.DropIndex(
                name: "IX_Repartidores_CodigoAcceso",
                table: "Repartidores");

            migrationBuilder.AlterColumn<string>(
                name: "CodigoAcceso",
                table: "Repartidores",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Repartidores_CodigoAcceso",
                table: "Repartidores",
                column: "CodigoAcceso",
                unique: true);
        }
    }
}
