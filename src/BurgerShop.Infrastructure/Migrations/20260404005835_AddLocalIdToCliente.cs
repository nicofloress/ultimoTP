using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "Clientes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_LocalId",
                table: "Clientes",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Locales_LocalId",
                table: "Clientes",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Locales_LocalId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_LocalId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "Clientes");
        }
    }
}
