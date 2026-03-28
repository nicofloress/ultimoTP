using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSnacksCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Activa", "CategoriaPadreId", "Nombre", "SeccionCamioneta" },
                values: new object[] { 19, true, null, "Snacks", 9 });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Marca", "Nombre", "NumeroInterno", "PesoGramos", "Precio", "UnidadesPorBulto" },
                values: new object[,]
                {
                    { 25, true, 19, null, null, "Krachitos", "Krachitos Combo con papa 600gr", null, 600, 0m, 1 },
                    { 26, true, 19, null, null, "Krachitos", "Krachitos Combo con papa 350gr", null, 350, 0m, 1 },
                    { 27, true, 19, null, null, "Krachitos", "Krachitos Combo 600gr SIN MANI", null, 600, 0m, 1 },
                    { 28, true, 19, null, null, "Krachitos", "Krachitos Combo 350gr SIN MANI", null, 350, 0m, 1 },
                    { 29, true, 19, null, null, "Krachitos", "Krachitos Maicitos 400gr", null, 400, 0m, 1 },
                    { 30, true, 19, null, null, "Krachitos", "Krachitos Bastoncito Queso 300gr", null, 300, 0m, 1 },
                    { 31, true, 19, null, null, "Krachitos", "Krachitos Papas Cheddar 350gr", null, 350, 0m, 1 },
                    { 32, true, 19, null, null, "Krachitos", "Krachitos Papas Americanas 600gr", null, 600, 0m, 1 },
                    { 33, true, 19, null, null, "Krachitos", "Krachitos Papas fritas comunes 600gr", null, 600, 0m, 1 },
                    { 34, true, 19, null, null, "Krachitos", "Krachitos Mani Krachitos 500gr", null, 500, 0m, 1 },
                    { 35, true, 19, null, null, "Krachitos", "Krachitos Mani cervecero 500gr", null, 500, 0m, 1 },
                    { 36, true, 19, null, null, "Krachitos", "Krachitos Palitos de Queso 500gr", null, 500, 0m, 1 },
                    { 37, true, 19, null, null, "Krachitos", "Krachitos Palitos 800gr", null, 800, 0m, 1 },
                    { 38, true, 19, null, null, "Riquitos", "Riquitos Combo Palitos 330gr+Papas 460gr+Palitos 400gr 1kg", null, 1000, 0m, 1 },
                    { 39, true, 19, null, null, "Riquitos", "Riquitos Palitos 400gr", null, 400, 0m, 1 },
                    { 40, true, 19, null, null, "Riquitos", "Riquitos Chizitos 330gr", null, 330, 0m, 1 },
                    { 41, true, 19, null, null, "Riquitos", "Riquitos Chizitos 1kg", null, 1000, 0m, 1 },
                    { 42, true, 19, null, null, "Riquitos", "Riquitos Papas pay 500gr", null, 500, 0m, 1 },
                    { 43, true, 19, null, null, "Riquitos", "Riquitos Papas tradicionales 1kg", null, 1000, 0m, 1 },
                    { 44, true, 19, null, null, "Riquitos", "Riquitos Papas tradicionales 460gr", null, 460, 0m, 1 },
                    { 45, true, 19, null, null, "Riquitos", "Riquitos Papas Cheddar 460gr", null, 460, 0m, 1 },
                    { 46, true, 19, null, null, "Riquitos", "Riquitos Papas Jamon Serrano 400gr", null, 400, 0m, 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 19);
        }
    }
}
