using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixNumeroInternoUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos",
                column: "NumeroInterno",
                unique: true,
                filter: "\"NumeroInterno\" IS NOT NULL AND \"NumeroInterno\" != ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos",
                column: "NumeroInterno",
                unique: true);
        }
    }
}
