using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCierreCajaIdAMovimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CierreCajaId",
                table: "Movimientos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_CierreCajaId",
                table: "Movimientos",
                column: "CierreCajaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimientos_CierresCaja_CierreCajaId",
                table: "Movimientos",
                column: "CierreCajaId",
                principalTable: "CierresCaja",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimientos_CierresCaja_CierreCajaId",
                table: "Movimientos");

            migrationBuilder.DropIndex(
                name: "IX_Movimientos_CierreCajaId",
                table: "Movimientos");

            migrationBuilder.DropColumn(
                name: "CierreCajaId",
                table: "Movimientos");
        }
    }
}
