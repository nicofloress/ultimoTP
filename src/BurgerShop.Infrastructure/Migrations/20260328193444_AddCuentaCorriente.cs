using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCuentaCorriente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PermiteCuentaCorriente",
                table: "TiposCliente",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CuentasCorrientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    SaldoActual = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LimiteCredito = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    FechaApertura = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaUltimoMovimiento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentasCorrientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuentasCorrientes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosCuentaCorriente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CuentaCorrienteId = table.Column<int>(type: "integer", nullable: false),
                    FechaMovimiento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaProceso = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SaldoResultante = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PedidoId = table.Column<int>(type: "integer", nullable: true),
                    VentaId = table.Column<int>(type: "integer", nullable: true),
                    MovimientoId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosCuentaCorriente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientosCuentaCorriente_CuentasCorrientes_CuentaCorrient~",
                        column: x => x.CuentaCorrienteId,
                        principalTable: "CuentasCorrientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovimientosCuentaCorriente_Movimientos_MovimientoId",
                        column: x => x.MovimientoId,
                        principalTable: "Movimientos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MovimientosCuentaCorriente_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MovimientosCuentaCorriente_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MovimientosCuentaCorriente_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "CodigosAccion",
                columns: new[] { "Id", "Activo", "Codigo", "Nombre", "Signo", "TipoAfectacion" },
                values: new object[,]
                {
                    { 13, true, "PAG_CTA", "Pago Cuenta Corriente", 1, 2 },
                    { 14, true, "NTC_CTA", "Nota de Credito Cta Cte", -1, 2 }
                });

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 1,
                column: "PermiteCuentaCorriente",
                value: false);

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 2,
                column: "PermiteCuentaCorriente",
                value: false);

            migrationBuilder.UpdateData(
                table: "TiposCliente",
                keyColumn: "Id",
                keyValue: 3,
                column: "PermiteCuentaCorriente",
                value: false);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasCorrientes_ClienteId",
                table: "CuentasCorrientes",
                column: "ClienteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_CuentaCorrienteId_FechaMovimiento",
                table: "MovimientosCuentaCorriente",
                columns: new[] { "CuentaCorrienteId", "FechaMovimiento" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_MovimientoId",
                table: "MovimientosCuentaCorriente",
                column: "MovimientoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_PedidoId",
                table: "MovimientosCuentaCorriente",
                column: "PedidoId",
                filter: "\"PedidoId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_UsuarioId",
                table: "MovimientosCuentaCorriente",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_VentaId",
                table: "MovimientosCuentaCorriente",
                column: "VentaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimientosCuentaCorriente");

            migrationBuilder.DropTable(
                name: "CuentasCorrientes");

            migrationBuilder.DeleteData(
                table: "CodigosAccion",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "CodigosAccion",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DropColumn(
                name: "PermiteCuentaCorriente",
                table: "TiposCliente");
        }
    }
}
