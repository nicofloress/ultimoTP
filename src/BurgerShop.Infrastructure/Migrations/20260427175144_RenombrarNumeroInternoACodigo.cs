using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenombrarNumeroInternoACodigo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos");

            migrationBuilder.RenameColumn(
                name: "NumeroInterno",
                table: "Productos",
                newName: "Codigo");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Codigo",
                table: "Productos",
                column: "Codigo",
                unique: true,
                filter: "\"Codigo\" IS NOT NULL AND \"Codigo\" != ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Productos_Codigo",
                table: "Productos");

            migrationBuilder.RenameColumn(
                name: "Codigo",
                table: "Productos",
                newName: "NumeroInterno");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos",
                column: "NumeroInterno",
                unique: true,
                filter: "\"NumeroInterno\" IS NOT NULL AND \"NumeroInterno\" != ''");
        }
    }
}
