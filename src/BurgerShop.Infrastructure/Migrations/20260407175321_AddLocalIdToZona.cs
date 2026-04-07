using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToZona : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "Zonas",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "Id",
                keyValue: 1,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "Id",
                keyValue: 2,
                column: "LocalId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Zonas_LocalId",
                table: "Zonas",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Zonas_Locales_LocalId",
                table: "Zonas",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Zonas_Locales_LocalId",
                table: "Zonas");

            migrationBuilder.DropIndex(
                name: "IX_Zonas_LocalId",
                table: "Zonas");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "Zonas");
        }
    }
}
