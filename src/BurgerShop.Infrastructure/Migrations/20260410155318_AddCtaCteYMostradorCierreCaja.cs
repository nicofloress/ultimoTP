using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCtaCteYMostradorCierreCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CantidadCtaCte",
                table: "CierresCaja",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CantidadMostrador",
                table: "CierresCaja",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalCtaCte",
                table: "CierresCaja",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalMostrador",
                table: "CierresCaja",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CantidadCtaCte",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "CantidadMostrador",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "TotalCtaCte",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "TotalMostrador",
                table: "CierresCaja");
        }
    }
}
