using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToRepartidor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "Repartidores",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Repartidores",
                keyColumn: "Id",
                keyValue: 1,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Repartidores",
                keyColumn: "Id",
                keyValue: 2,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Repartidores",
                keyColumn: "Id",
                keyValue: 3,
                column: "LocalId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Repartidores_LocalId",
                table: "Repartidores",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Repartidores_Locales_LocalId",
                table: "Repartidores",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Repartidores_Locales_LocalId",
                table: "Repartidores");

            migrationBuilder.DropIndex(
                name: "IX_Repartidores_LocalId",
                table: "Repartidores");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "Repartidores");
        }
    }
}
