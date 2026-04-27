using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigoCombo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                table: "Combos",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 1,
                column: "Codigo",
                value: "30x69ep+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 2,
                column: "Codigo",
                value: "30x80ep+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 3,
                column: "Codigo",
                value: "20x110ep+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 4,
                column: "Codigo",
                value: "30x80pp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 5,
                column: "Codigo",
                value: "20x110pp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 6,
                column: "Codigo",
                value: "20x120pp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 7,
                column: "Codigo",
                value: "12x160pp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 8,
                column: "Codigo",
                value: "12x198pp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 9,
                column: "Codigo",
                value: "60x69ep");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 10,
                column: "Codigo",
                value: "60x80ep");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 11,
                column: "Codigo",
                value: "40x110ep");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 12,
                column: "Codigo",
                value: "60x80pp");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 13,
                column: "Codigo",
                value: "40x110pp");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 14,
                column: "Codigo",
                value: "40x120pp");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 15,
                column: "Codigo",
                value: "24x160pp");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 16,
                column: "Codigo",
                value: "24x198pp");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 17,
                column: "Codigo",
                value: "72x55ep");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 18,
                column: "Codigo",
                value: "72x55e");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 19,
                column: "Codigo",
                value: "30panp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 20,
                column: "Codigo",
                value: "60panp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 21,
                column: "Codigo",
                value: "36spanp+");

            migrationBuilder.UpdateData(
                table: "Combos",
                keyColumn: "Id",
                keyValue: 22,
                column: "Codigo",
                value: "60spanp+");

            migrationBuilder.CreateIndex(
                name: "IX_Combos_Codigo",
                table: "Combos",
                column: "Codigo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Combos_Codigo",
                table: "Combos");

            migrationBuilder.DropColumn(
                name: "Codigo",
                table: "Combos");
        }
    }
}
