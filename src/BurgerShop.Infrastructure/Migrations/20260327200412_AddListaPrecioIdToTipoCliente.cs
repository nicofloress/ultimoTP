using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddListaPrecioIdToTipoCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ListaPrecioId",
                table: "TiposCliente",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 1,
                column: "ListaPrecioId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 2,
                column: "ListaPrecioId",
                value: null);

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 3,
                column: "ListaPrecioId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_TiposCliente_ListaPrecioId",
                table: "TiposCliente",
                column: "ListaPrecioId");

            migrationBuilder.AddForeignKey(
                name: "FK_TiposCliente_ListasPrecios_ListaPrecioId",
                table: "TiposCliente",
                column: "ListaPrecioId",
                principalTable: "ListasPrecios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TiposCliente_ListasPrecios_ListaPrecioId",
                table: "TiposCliente");

            migrationBuilder.DropIndex(
                name: "IX_TiposCliente_ListaPrecioId",
                table: "TiposCliente");

            migrationBuilder.DropColumn(
                name: "ListaPrecioId",
                table: "TiposCliente");
        }
    }
}
