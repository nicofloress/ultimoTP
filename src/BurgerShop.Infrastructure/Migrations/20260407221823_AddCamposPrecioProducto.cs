using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposPrecioProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DiferenciaPrecioCosto",
                table: "Productos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimaModificacionPrecio",
                table: "Productos",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecioCosto",
                table: "Productos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecioVenta",
                table: "Productos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "DiferenciaPrecioCosto", "FechaUltimaModificacionPrecio", "PrecioCosto", "PrecioVenta" },
                values: new object[] { 0m, null, 0m, 0m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiferenciaPrecioCosto",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "FechaUltimaModificacionPrecio",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "PrecioCosto",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "PrecioVenta",
                table: "Productos");
        }
    }
}
