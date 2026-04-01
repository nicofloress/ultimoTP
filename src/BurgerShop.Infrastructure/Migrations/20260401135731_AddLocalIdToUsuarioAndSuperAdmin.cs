using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToUsuarioAndSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "Usuarios",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 4,
                column: "LocalId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 5,
                column: "LocalId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_LocalId",
                table: "Usuarios",
                column: "LocalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Locales_LocalId",
                table: "Usuarios",
                column: "LocalId",
                principalTable: "Locales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Locales_LocalId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_LocalId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "Usuarios");
        }
    }
}
