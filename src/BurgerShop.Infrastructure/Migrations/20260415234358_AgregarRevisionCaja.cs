using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRevisionCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Migrar cajas cerradas: Estado 2 (antes Cerrada) → 3 (nuevo valor de Cerrada)
            migrationBuilder.Sql("UPDATE \"CierresCaja\" SET \"Estado\" = 3 WHERE \"Estado\" = 2");

            migrationBuilder.AddColumn<decimal>(
                name: "DiferenciaCaja",
                table: "CierresCaja",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaRevision",
                table: "CierresCaja",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoEfectivoReal",
                table: "CierresCaja",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionRevision",
                table: "CierresCaja",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResultadoRevision",
                table: "CierresCaja",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RevisadoPorUsuarioId",
                table: "CierresCaja",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiferenciaCaja",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "FechaRevision",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "MontoEfectivoReal",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "ObservacionRevision",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "ResultadoRevision",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "RevisadoPorUsuarioId",
                table: "CierresCaja");
        }
    }
}
