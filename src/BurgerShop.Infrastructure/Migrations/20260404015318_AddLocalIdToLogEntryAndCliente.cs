using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalIdToLogEntryAndCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalId",
                table: "LogEntries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalNombre",
                table: "LogEntries",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocalId",
                table: "LogEntries");

            migrationBuilder.DropColumn(
                name: "LocalNombre",
                table: "LogEntries");
        }
    }
}
