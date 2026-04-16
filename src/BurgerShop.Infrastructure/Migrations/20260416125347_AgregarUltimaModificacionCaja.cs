using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarUltimaModificacionCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimaModificacion",
                table: "CierresCaja",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UsuarioUltimaModificacionId",
                table: "CierresCaja",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaUltimaModificacion",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "UsuarioUltimaModificacionId",
                table: "CierresCaja");
        }
    }
}
