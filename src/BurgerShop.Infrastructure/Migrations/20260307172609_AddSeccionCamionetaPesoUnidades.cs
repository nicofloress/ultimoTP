using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSeccionCamionetaPesoUnidades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PesoGramos",
                table: "Productos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnidadesPorBulto",
                table: "Productos",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SeccionCamioneta",
                table: "Categorias",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 1,
                column: "SeccionCamioneta",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 2,
                column: "SeccionCamioneta",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 3,
                column: "SeccionCamioneta",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 4,
                column: "SeccionCamioneta",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 5,
                column: "SeccionCamioneta",
                value: 4);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 6,
                column: "SeccionCamioneta",
                value: 5);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 7,
                column: "SeccionCamioneta",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 8,
                column: "SeccionCamioneta",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 9,
                column: "SeccionCamioneta",
                value: 6);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 10,
                column: "SeccionCamioneta",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 11,
                column: "SeccionCamioneta",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 12,
                column: "SeccionCamioneta",
                value: 7);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 13,
                column: "SeccionCamioneta",
                value: 8);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 14,
                column: "SeccionCamioneta",
                value: 9);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 15,
                column: "SeccionCamioneta",
                value: 9);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 16,
                column: "SeccionCamioneta",
                value: 9);

            migrationBuilder.UpdateData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 17,
                column: "SeccionCamioneta",
                value: 10);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 30 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 40 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 4 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 20 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 4 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 4 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 30 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 2 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 24 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 6 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 12 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 4 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 47,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 48,
                columns: new[] { "PesoGramos", "UnidadesPorBulto" },
                values: new object[] { null, 1 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PesoGramos",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "UnidadesPorBulto",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "SeccionCamioneta",
                table: "Categorias");
        }
    }
}
