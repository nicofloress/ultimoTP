using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPromocionesConCondiciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ValorDescuento",
                table: "Promociones",
                newName: "ValorBeneficio");

            migrationBuilder.RenameColumn(
                name: "TipoDescuento",
                table: "Promociones",
                newName: "TipoBeneficio");

            migrationBuilder.AddColumn<bool>(
                name: "Acumulable",
                table: "Promociones",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Prioridad",
                table: "Promociones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TopeMaximo",
                table: "Promociones",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PromocionCondiciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PromocionId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromocionCondiciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromocionCondiciones_Promociones_PromocionId",
                        column: x => x.PromocionId,
                        principalTable: "Promociones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromocionCondiciones_PromocionId_Tipo",
                table: "PromocionCondiciones",
                columns: new[] { "PromocionId", "Tipo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromocionCondiciones");

            migrationBuilder.DropColumn(
                name: "Acumulable",
                table: "Promociones");

            migrationBuilder.DropColumn(
                name: "Prioridad",
                table: "Promociones");

            migrationBuilder.DropColumn(
                name: "TopeMaximo",
                table: "Promociones");

            migrationBuilder.RenameColumn(
                name: "ValorBeneficio",
                table: "Promociones",
                newName: "ValorDescuento");

            migrationBuilder.RenameColumn(
                name: "TipoBeneficio",
                table: "Promociones",
                newName: "TipoDescuento");
        }
    }
}
