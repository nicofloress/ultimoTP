using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAderezoBenidorVariantes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Nombre", "PesoGramos" },
                values: new object[] { "Mayonesa 250gr", 250 });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Marca", "Nombre", "NumeroInterno", "PesoGramos", "Precio", "UnidadesPorBulto" },
                values: new object[,]
                {
                    { 17, true, 16, null, null, "Benidor", "Mayonesa 500gr", null, 500, 4000m, 1 },
                    { 18, true, 16, null, null, "Benidor", "Ketchup 250gr", null, 250, 2500m, 1 },
                    { 19, true, 16, null, null, "Benidor", "Ketchup 500gr", null, 500, 4000m, 1 },
                    { 20, true, 16, null, null, "Benidor", "Mostaza 250gr", null, 250, 2500m, 1 },
                    { 21, true, 16, null, null, "Benidor", "Mostaza 500gr", null, 500, 4000m, 1 },
                    { 22, true, 16, null, null, "Benidor", "Cheddar 500gr", null, 500, 4500m, 1 },
                    { 23, true, 16, null, null, "Benidor", "Parmesano 500gr", null, 500, 4500m, 1 },
                    { 24, true, 16, null, null, "Benidor", "Barbacoa 500gr", null, 500, 4500m, 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Nombre", "PesoGramos" },
                values: new object[] { "Aderezo Benidor", null });
        }
    }
}
