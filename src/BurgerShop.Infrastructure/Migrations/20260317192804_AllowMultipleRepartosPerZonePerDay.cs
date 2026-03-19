using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleRepartosPerZonePerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepartosZona_ZonaId_Fecha",
                table: "RepartosZona");

            migrationBuilder.CreateIndex(
                name: "IX_RepartosZona_ZonaId_Fecha",
                table: "RepartosZona",
                columns: new[] { "ZonaId", "Fecha" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepartosZona_ZonaId_Fecha",
                table: "RepartosZona");

            migrationBuilder.CreateIndex(
                name: "IX_RepartosZona_ZonaId_Fecha",
                table: "RepartosZona",
                columns: new[] { "ZonaId", "Fecha" },
                unique: true);
        }
    }
}
