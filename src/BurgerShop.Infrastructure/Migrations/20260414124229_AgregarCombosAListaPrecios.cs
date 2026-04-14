using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCombosAListaPrecios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ProductoId",
                table: "ListasPreciosDetalle");

            migrationBuilder.AlterColumn<int>(
                name: "ProductoId",
                table: "ListasPreciosDetalle",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ComboId",
                table: "ListasPreciosDetalle",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ComboId",
                table: "ListasPreciosDetalle",
                column: "ComboId");

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ComboId",
                table: "ListasPreciosDetalle",
                columns: new[] { "ListaPrecioId", "ComboId" },
                unique: true,
                filter: "\"ComboId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ProductoId",
                table: "ListasPreciosDetalle",
                columns: new[] { "ListaPrecioId", "ProductoId" },
                unique: true,
                filter: "\"ProductoId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_ListasPreciosDetalle_Combos_ComboId",
                table: "ListasPreciosDetalle",
                column: "ComboId",
                principalTable: "Combos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListasPreciosDetalle_Combos_ComboId",
                table: "ListasPreciosDetalle");

            migrationBuilder.DropIndex(
                name: "IX_ListasPreciosDetalle_ComboId",
                table: "ListasPreciosDetalle");

            migrationBuilder.DropIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ComboId",
                table: "ListasPreciosDetalle");

            migrationBuilder.DropIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ProductoId",
                table: "ListasPreciosDetalle");

            migrationBuilder.DropColumn(
                name: "ComboId",
                table: "ListasPreciosDetalle");

            migrationBuilder.AlterColumn<int>(
                name: "ProductoId",
                table: "ListasPreciosDetalle",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ProductoId",
                table: "ListasPreciosDetalle",
                columns: new[] { "ListaPrecioId", "ProductoId" },
                unique: true);
        }
    }
}
