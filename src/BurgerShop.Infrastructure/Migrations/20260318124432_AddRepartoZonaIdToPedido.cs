using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRepartoZonaIdToPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RepartoZonaId",
                table: "Pedidos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_RepartoZonaId",
                table: "Pedidos",
                column: "RepartoZonaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_RepartosZona_RepartoZonaId",
                table: "Pedidos",
                column: "RepartoZonaId",
                principalTable: "RepartosZona",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_RepartosZona_RepartoZonaId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_RepartoZonaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "RepartoZonaId",
                table: "Pedidos");
        }
    }
}
