using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRendicionRepartidor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RendicionesRepartidor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RepartidorId = table.Column<int>(type: "integer", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    TotalEfectivo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalTransferencia = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalNoEntregado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CantidadEntregados = table.Column<int>(type: "integer", nullable: false),
                    CantidadNoEntregados = table.Column<int>(type: "integer", nullable: false),
                    EfectivoDeclarado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Diferencia = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Aprobada = table.Column<bool>(type: "boolean", nullable: false),
                    FechaAprobacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RendicionesRepartidor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RendicionesRepartidor_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RendicionesDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RendicionId = table.Column<int>(type: "integer", nullable: false),
                    PedidoId = table.Column<int>(type: "integer", nullable: false),
                    NumeroTicket = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FormaPago = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Total = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RendicionesDetalle", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RendicionesDetalle_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RendicionesDetalle_RendicionesRepartidor_RendicionId",
                        column: x => x.RendicionId,
                        principalTable: "RendicionesRepartidor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesDetalle_PedidoId",
                table: "RendicionesDetalle",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesDetalle_RendicionId",
                table: "RendicionesDetalle",
                column: "RendicionId");

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesRepartidor_Fecha",
                table: "RendicionesRepartidor",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesRepartidor_RepartidorId",
                table: "RendicionesRepartidor",
                column: "RepartidorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RendicionesDetalle");

            migrationBuilder.DropTable(
                name: "RendicionesRepartidor");
        }
    }
}
