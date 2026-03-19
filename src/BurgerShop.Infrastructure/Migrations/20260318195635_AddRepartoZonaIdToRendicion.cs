using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRepartoZonaIdToRendicion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RepartoZonaId",
                table: "RendicionesRepartidor",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesRepartidor_RepartoZonaId",
                table: "RendicionesRepartidor",
                column: "RepartoZonaId");

            migrationBuilder.AddForeignKey(
                name: "FK_RendicionesRepartidor_RepartosZona_RepartoZonaId",
                table: "RendicionesRepartidor",
                column: "RepartoZonaId",
                principalTable: "RepartosZona",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RendicionesRepartidor_RepartosZona_RepartoZonaId",
                table: "RendicionesRepartidor");

            migrationBuilder.DropIndex(
                name: "IX_RendicionesRepartidor_RepartoZonaId",
                table: "RendicionesRepartidor");

            migrationBuilder.DropColumn(
                name: "RepartoZonaId",
                table: "RendicionesRepartidor");
        }
    }
}
