using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaProgramada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaProgramada",
                table: "Pedidos",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_FechaProgramada",
                table: "Pedidos",
                column: "FechaProgramada");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pedidos_FechaProgramada",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "FechaProgramada",
                table: "Pedidos");
        }
    }
}
