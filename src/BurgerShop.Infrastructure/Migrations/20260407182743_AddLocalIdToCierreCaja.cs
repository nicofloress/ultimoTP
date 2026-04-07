using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToCierreCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "CierresCaja",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CierresCaja_LocalId",
                table: "CierresCaja",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_CierresCaja_Locales_LocalId",
                table: "CierresCaja",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CierresCaja_Locales_LocalId",
                table: "CierresCaja");

            migrationBuilder.DropIndex(
                name: "IX_CierresCaja_LocalId",
                table: "CierresCaja");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "CierresCaja");
        }
    }
}
