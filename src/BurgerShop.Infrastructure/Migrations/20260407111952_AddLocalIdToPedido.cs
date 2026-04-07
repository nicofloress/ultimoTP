using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "Pedidos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_LocalId",
                table: "Pedidos",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Locales_LocalId",
                table: "Pedidos",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Locales_LocalId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_LocalId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "Pedidos");
        }
    }
}
