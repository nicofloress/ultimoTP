using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLogEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LogEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fecha = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Nivel = table.Column<int>(type: "integer", nullable: false),
                    Origen = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Mensaje = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    StackTrace = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioNombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Rol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HttpMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Ruta = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StatusCode = table.Column<int>(type: "integer", nullable: true),
                    IP = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DuracionMs = table.Column<long>(type: "bigint", nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_Fecha",
                table: "LogEntries",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_Nivel",
                table: "LogEntries",
                column: "Nivel");

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_UsuarioId",
                table: "LogEntries",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogEntries");
        }
    }
}
