using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotaInternaTipoFacturaListasPreciosPagoDivididoCierreCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CierreCajaId",
                table: "Pedidos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotaInterna",
                table: "Pedidos",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipoFactura",
                table: "Pedidos",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ListaPrecioId",
                table: "Clientes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipoClienteId",
                table: "Clientes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CierresCaja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FechaApertura = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MontoInicial = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontoFinal = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Estado = table.Column<int>(type: "INTEGER", nullable: false),
                    Observaciones = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    UsuarioId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CierresCaja", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ListasPrecios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    EsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    Activa = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListasPrecios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PagosPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PedidoId = table.Column<int>(type: "INTEGER", nullable: false),
                    FormaPagoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PorcentajeRecargo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Recargo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalACobrar = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosPedido", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosPedido_FormasPago_FormaPagoId",
                        column: x => x.FormaPagoId,
                        principalTable: "FormasPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosPedido_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CierresCajaDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CierreCajaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FormaPagoId = table.Column<int>(type: "INTEGER", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CantidadOperaciones = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CierresCajaDetalle", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CierresCajaDetalle_CierresCaja_CierreCajaId",
                        column: x => x.CierreCajaId,
                        principalTable: "CierresCaja",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CierresCajaDetalle_FormasPago_FormaPagoId",
                        column: x => x.FormaPagoId,
                        principalTable: "FormasPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ListasPreciosDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ListaPrecioId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListasPreciosDetalle", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListasPreciosDetalle_ListasPrecios_ListaPrecioId",
                        column: x => x.ListaPrecioId,
                        principalTable: "ListasPrecios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ListasPreciosDetalle_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_CierreCajaId",
                table: "Pedidos",
                column: "CierreCajaId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_ListaPrecioId",
                table: "Clientes",
                column: "ListaPrecioId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_TipoClienteId",
                table: "Clientes",
                column: "TipoClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CierresCaja_Estado",
                table: "CierresCaja",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_CierresCaja_FechaApertura",
                table: "CierresCaja",
                column: "FechaApertura");

            migrationBuilder.CreateIndex(
                name: "IX_CierresCajaDetalle_CierreCajaId",
                table: "CierresCajaDetalle",
                column: "CierreCajaId");

            migrationBuilder.CreateIndex(
                name: "IX_CierresCajaDetalle_FormaPagoId",
                table: "CierresCajaDetalle",
                column: "FormaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_ListasPrecios_Nombre",
                table: "ListasPrecios",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ListaPrecioId_ProductoId",
                table: "ListasPreciosDetalle",
                columns: new[] { "ListaPrecioId", "ProductoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListasPreciosDetalle_ProductoId",
                table: "ListasPreciosDetalle",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosPedido_FormaPagoId",
                table: "PagosPedido",
                column: "FormaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosPedido_PedidoId",
                table: "PagosPedido",
                column: "PedidoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_ListasPrecios_ListaPrecioId",
                table: "Clientes",
                column: "ListaPrecioId",
                principalTable: "ListasPrecios",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_TiposCliente_TipoClienteId",
                table: "Clientes",
                column: "TipoClienteId",
                principalTable: "TiposCliente",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_CierresCaja_CierreCajaId",
                table: "Pedidos",
                column: "CierreCajaId",
                principalTable: "CierresCaja",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_ListasPrecios_ListaPrecioId",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_TiposCliente_TipoClienteId",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_CierresCaja_CierreCajaId",
                table: "Pedidos");

            migrationBuilder.DropTable(
                name: "CierresCajaDetalle");

            migrationBuilder.DropTable(
                name: "ListasPreciosDetalle");

            migrationBuilder.DropTable(
                name: "PagosPedido");

            migrationBuilder.DropTable(
                name: "CierresCaja");

            migrationBuilder.DropTable(
                name: "ListasPrecios");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_CierreCajaId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_ListaPrecioId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_TipoClienteId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "CierreCajaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "NotaInterna",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "TipoFactura",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "ListaPrecioId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "TipoClienteId",
                table: "Clientes");
        }
    }
}
