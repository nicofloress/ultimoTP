using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialComplete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Activa = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FormasPago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    PorcentajeRecargo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormasPago", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Contacto = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Direccion = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Repartidores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Vehiculo = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CodigoAcceso = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Repartidores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TiposCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposCliente", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zonas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CostoEnvio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zonas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Combos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CategoriaId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Combos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Combos_Categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categorias",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CategoriaId = table.Column<int>(type: "INTEGER", nullable: false),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImagenUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    NumeroInterno = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Productos_Categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NombreUsuario = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    NombreCompleto = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Rol = table.Column<string>(type: "TEXT", nullable: false),
                    RepartidorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Direccion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ZonaId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_Zonas_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "Zonas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RepartidorZonas",
                columns: table => new
                {
                    RepartidorId = table.Column<int>(type: "INTEGER", nullable: false),
                    ZonaId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepartidorZonas", x => new { x.RepartidorId, x.ZonaId });
                    table.ForeignKey(
                        name: "FK_RepartidorZonas_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RepartidorZonas_Zonas_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "Zonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComboDetalles",
                columns: table => new
                {
                    ComboId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Cantidad = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComboDetalles", x => new { x.ComboId, x.ProductoId });
                    table.ForeignKey(
                        name: "FK_ComboDetalles_Combos_ComboId",
                        column: x => x.ComboId,
                        principalTable: "Combos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComboDetalles_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NumeroTicket = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Tipo = table.Column<int>(type: "INTEGER", nullable: false),
                    Estado = table.Column<int>(type: "INTEGER", nullable: false),
                    ClienteId = table.Column<int>(type: "INTEGER", nullable: true),
                    NombreCliente = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TelefonoCliente = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    DireccionEntrega = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ZonaId = table.Column<int>(type: "INTEGER", nullable: true),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descuento = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Recargo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FormaPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    RepartidorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaAsignacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FechaEntrega = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NotasEntrega = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pedidos_FormasPago_FormaPagoId",
                        column: x => x.FormaPagoId,
                        principalTable: "FormasPago",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pedidos_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pedidos_Zonas_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "Zonas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LineasPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PedidoId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: true),
                    ComboId = table.Column<int>(type: "INTEGER", nullable: true),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "INTEGER", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineasPedido", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineasPedido_Combos_ComboId",
                        column: x => x.ComboId,
                        principalTable: "Combos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LineasPedido_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LineasPedido_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Activa", "Nombre" },
                values: new object[,]
                {
                    { 1, true, "Hamburguesas" },
                    { 2, true, "Maxi Hamburguesas" },
                    { 3, true, "Super Hamburguesas" },
                    { 4, true, "Mega Hamburguesas" },
                    { 5, true, "Pan Hamburguesa" },
                    { 6, true, "Pan Maxi Hamburguesa" },
                    { 7, true, "Panchos" },
                    { 8, true, "Salchichas" },
                    { 9, true, "Pan Pancho" },
                    { 10, true, "Super Panchos" },
                    { 11, true, "Salchichas Largas" },
                    { 12, true, "Pan Super Pancho" },
                    { 13, true, "Aderezos" },
                    { 14, true, "Snacks" },
                    { 15, true, "Congelados" },
                    { 16, true, "Bebidas" },
                    { 17, true, "Ofertas Semanales" }
                });

            migrationBuilder.InsertData(
                table: "FormasPago",
                columns: new[] { "Id", "Activa", "Nombre", "PorcentajeRecargo" },
                values: new object[,]
                {
                    { 1, true, "Efectivo", 0m },
                    { 2, true, "MercadoPago Transferencia", 0m },
                    { 3, true, "Banco Galicia Débito", 0m },
                    { 4, true, "Banco Galicia Crédito 1 cuota", 10m },
                    { 5, true, "Banco Galicia Crédito 2 cuotas", 20m },
                    { 6, true, "Banco Galicia Crédito 3 cuotas", 30m }
                });

            migrationBuilder.InsertData(
                table: "Repartidores",
                columns: new[] { "Id", "Activo", "CodigoAcceso", "Nombre", "Telefono", "Vehiculo" },
                values: new object[,]
                {
                    { 1, true, "1234", "Juan Pérez", "11-1234-5678", "Moto" },
                    { 2, true, "5678", "María García", "11-8765-4321", "Bicicleta" }
                });

            migrationBuilder.InsertData(
                table: "TiposCliente",
                columns: new[] { "Id", "Activo", "Descripcion", "Nombre" },
                values: new object[,]
                {
                    { 1, true, null, "Consumidor Final" },
                    { 2, true, null, "Mayorista" },
                    { 3, true, null, "Empleado" }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "NombreCompleto", "NombreUsuario", "PasswordHash", "RepartidorId", "Rol" },
                values: new object[,]
                {
                    { 1, true, "Administrador del Sistema", "admin", "$2a$11$kU/EX5XSqZjkxGiq0vjhFOnj6.k2QosL/YfjYTAJKRMQIz9NuHWhK", null, "Administrador" },
                    { 2, true, "Operador Local", "local", "$2a$11$0pKoaFrCbKlj/IQINhN4pumdQ550SnejahxpjBg.MLgbuTtKCufAa", null, "Local" }
                });

            migrationBuilder.InsertData(
                table: "Zonas",
                columns: new[] { "Id", "Activa", "CostoEnvio", "Descripcion", "Nombre" },
                values: new object[,]
                {
                    { 1, true, 0m, null, "Norte" },
                    { 2, true, 0m, null, "Sur" }
                });

            migrationBuilder.InsertData(
                table: "Combos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "Nombre", "Precio" },
                values: new object[,]
                {
                    { 1, true, 17, "40 hamburguesas 110gr + 40 panes", "Promo 40 Hamburguesas + Pan", 3700m },
                    { 2, true, 17, "30 hamburguesas 69gr + 30 panes", "Promo 30 Hamburguesas + Pan", 2700m },
                    { 3, true, 17, "30 panchos + 30 panes", "Promo 30 Panchos", 1900m },
                    { 4, true, 17, "18 super panchos + 18 panes", "Promo 18 Super Panchos", 1600m },
                    { 5, true, 17, "36 super panchos + 36 panes", "Promo 36 Super Panchos", 2950m }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Nombre", "NumeroInterno", "Precio" },
                values: new object[,]
                {
                    { 1, true, 1, null, null, "Hamburguesa x 1", "HAM-001", 50m },
                    { 2, true, 1, null, null, "Hamburguesa x 2", "HAM-002", 100m },
                    { 3, true, 1, null, null, "Hamburguesa x 6", "HAM-003", 250m },
                    { 4, true, 1, null, null, "Hamburguesa x 12", "HAM-004", 400m },
                    { 5, true, 1, null, null, "Hamburguesa x 30", "HAM-005", 750m },
                    { 6, true, 1, null, null, "Hamburguesa x 40", "HAM-006", 940m },
                    { 7, true, 2, null, null, "Maxi Hamburguesa x 1", "MAX-001", 70m },
                    { 8, true, 2, null, null, "Maxi Hamburguesa x 2", "MAX-002", 130m },
                    { 9, true, 2, null, null, "Maxi Hamburguesa x 4", "MAX-003", 260m },
                    { 10, true, 2, null, null, "Maxi Hamburguesa x 12", "MAX-004", 680m },
                    { 11, true, 2, null, null, "Maxi Hamburguesa x 20", "MAX-005", 1100m },
                    { 12, true, 3, null, null, "Super Hamburguesa x 1", "SUP-001", 100m },
                    { 13, true, 3, null, null, "Super Hamburguesa x 2", "SUP-002", 180m },
                    { 14, true, 3, null, null, "Super Hamburguesa x 4", "SUP-003", 350m },
                    { 15, true, 3, null, null, "Super Hamburguesa x 12", "SUP-004", 1000m },
                    { 16, true, 4, null, null, "Mega Hamburguesa x 1", "MEG-001", 120m },
                    { 17, true, 4, null, null, "Mega Hamburguesa x 2", "MEG-002", 220m },
                    { 18, true, 4, null, null, "Mega Hamburguesa x 4", "MEG-003", 420m },
                    { 19, true, 4, null, null, "Mega Hamburguesa x 12", "MEG-004", 1200m },
                    { 20, true, 5, null, null, "Pan Hamburguesa x 2", "PHA-001", 80m },
                    { 21, true, 5, null, null, "Pan Hamburguesa x 6", "PHA-002", 200m },
                    { 22, true, 5, null, null, "Pan Hamburguesa x 12", "PHA-003", 360m },
                    { 23, true, 5, null, null, "Pan Hamburguesa x 30", "PHA-004", 800m },
                    { 24, true, 6, null, null, "Pan Maxi x 2", "PMA-001", 100m },
                    { 25, true, 6, null, null, "Pan Maxi x 6", "PMA-002", 260m },
                    { 26, true, 6, null, null, "Pan Maxi x 12", "PMA-003", 480m },
                    { 27, true, 7, null, null, "Pancho x 6", "PAN-001", 150m },
                    { 28, true, 7, null, null, "Pancho x 12", "PAN-002", 260m },
                    { 29, true, 7, null, null, "Pancho x 24", "PAN-003", 480m },
                    { 30, true, 8, null, null, "Salchicha x 6", "SAL-001", 180m },
                    { 31, true, 8, null, null, "Salchicha x 12", "SAL-002", 320m },
                    { 32, true, 9, null, null, "Pan Pancho x 6", "PPH-001", 100m },
                    { 33, true, 9, null, null, "Pan Pancho x 12", "PPH-002", 180m },
                    { 34, true, 10, null, null, "Super Pancho x 6", "SPC-001", 200m },
                    { 35, true, 10, null, null, "Super Pancho x 12", "SPC-002", 380m },
                    { 36, true, 11, null, null, "Salchicha Larga x 6", "SLA-001", 220m },
                    { 37, true, 11, null, null, "Salchicha Larga x 12", "SLA-002", 400m },
                    { 38, true, 12, null, null, "Pan Super Pancho x 6", "PSP-001", 130m },
                    { 39, true, 12, null, null, "Pan Super Pancho x 12", "PSP-002", 240m },
                    { 40, true, 13, null, null, "Mayonesa", "ADR-001", 80m },
                    { 41, true, 13, null, null, "Ketchup", "ADR-002", 80m },
                    { 42, true, 13, null, null, "Mostaza", "ADR-003", 80m },
                    { 43, true, 14, null, null, "Papas Congeladas x 1kg", "SNK-001", 300m },
                    { 44, true, 15, null, null, "Empanadas x 12", "CON-001", 500m },
                    { 45, true, 15, null, null, "Milanesas x 4", "CON-002", 450m },
                    { 46, true, 16, null, null, "Coca Cola 1.5L", "BEB-001", 200m },
                    { 47, true, 16, null, null, "Sprite 1.5L", "BEB-002", 200m },
                    { 48, true, 16, null, null, "Agua 500ml", "BEB-003", 100m }
                });

            migrationBuilder.InsertData(
                table: "RepartidorZonas",
                columns: new[] { "RepartidorId", "ZonaId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 1, 2 },
                    { 2, 1 },
                    { 2, 2 }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "NombreCompleto", "NombreUsuario", "PasswordHash", "RepartidorId", "Rol" },
                values: new object[,]
                {
                    { 3, true, "Juan Pérez", "repartidor1", "$2a$11$GP5TV.wofKMCcswZFsFBHOvsLJ83PqGveVQ4bcUO9FuY4V9N54Mwi", 1, "Repartidor" },
                    { 4, true, "María García", "repartidor2", "$2a$11$W8Sz4uInizUbeN7QyFxus.yY5OeJjg1FpWxkbaweuNyzCipCAF87u", 2, "Repartidor" }
                });

            migrationBuilder.InsertData(
                table: "ComboDetalles",
                columns: new[] { "ComboId", "ProductoId", "Cantidad" },
                values: new object[,]
                {
                    { 1, 6, 1 },
                    { 1, 23, 2 },
                    { 2, 5, 1 },
                    { 2, 23, 1 },
                    { 3, 27, 1 },
                    { 3, 29, 1 },
                    { 3, 33, 2 },
                    { 4, 34, 3 },
                    { 4, 38, 3 },
                    { 5, 35, 3 },
                    { 5, 39, 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_ZonaId",
                table: "Clientes",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_ComboDetalles_ProductoId",
                table: "ComboDetalles",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Combos_CategoriaId",
                table: "Combos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_LineasPedido_ComboId",
                table: "LineasPedido",
                column: "ComboId");

            migrationBuilder.CreateIndex(
                name: "IX_LineasPedido_PedidoId",
                table: "LineasPedido",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_LineasPedido_ProductoId",
                table: "LineasPedido",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Pedidos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_Estado",
                table: "Pedidos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_FechaCreacion",
                table: "Pedidos",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_FormaPagoId",
                table: "Pedidos",
                column: "FormaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_NumeroTicket",
                table: "Pedidos",
                column: "NumeroTicket",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_RepartidorId",
                table: "Pedidos",
                column: "RepartidorId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_ZonaId",
                table: "Pedidos",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriaId",
                table: "Productos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_NumeroInterno",
                table: "Productos",
                column: "NumeroInterno",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Repartidores_CodigoAcceso",
                table: "Repartidores",
                column: "CodigoAcceso",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RepartidorZonas_ZonaId",
                table: "RepartidorZonas",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_NombreUsuario",
                table: "Usuarios",
                column: "NombreUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_RepartidorId",
                table: "Usuarios",
                column: "RepartidorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComboDetalles");

            migrationBuilder.DropTable(
                name: "LineasPedido");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DropTable(
                name: "RepartidorZonas");

            migrationBuilder.DropTable(
                name: "TiposCliente");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Combos");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "FormasPago");

            migrationBuilder.DropTable(
                name: "Repartidores");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropTable(
                name: "Zonas");
        }
    }
}
