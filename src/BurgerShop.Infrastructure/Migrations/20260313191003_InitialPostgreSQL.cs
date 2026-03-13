using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgreSQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    SeccionCamioneta = table.Column<int>(type: "integer", nullable: false),
                    CategoriaPadreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categorias_Categorias_CategoriaPadreId",
                        column: x => x.CategoriaPadreId,
                        principalTable: "Categorias",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CierresCaja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FechaApertura = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    MontoInicial = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MontoFinal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CierresCaja", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FormasPago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PorcentajeRecargo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormasPago", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ListasPrecios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListasPrecios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Contacto = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Repartidores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Vehiculo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CodigoAcceso = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Repartidores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TiposCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposCliente", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zonas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CostoEnvio = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zonas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Combos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Precio = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CategoriaId = table.Column<int>(type: "integer", nullable: true)
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Precio = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CategoriaId = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    ImagenUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NumeroInterno = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PesoGramos = table.Column<int>(type: "integer", nullable: true),
                    UnidadesPorBulto = table.Column<int>(type: "integer", nullable: false),
                    Marca = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UnidadesPorMedia = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
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
                name: "CierresCajaDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CierreCajaId = table.Column<int>(type: "integer", nullable: false),
                    FormaPagoId = table.Column<int>(type: "integer", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CantidadOperaciones = table.Column<int>(type: "integer", nullable: false)
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
                name: "Mensajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RepartidorId = table.Column<int>(type: "integer", nullable: false),
                    Texto = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    EsDeAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Leido = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mensajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mensajes_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UbicacionesRepartidor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RepartidorId = table.Column<int>(type: "integer", nullable: false),
                    Latitud = table.Column<double>(type: "double precision", nullable: false),
                    Longitud = table.Column<double>(type: "double precision", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UbicacionesRepartidor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UbicacionesRepartidor_Repartidores_RepartidorId",
                        column: x => x.RepartidorId,
                        principalTable: "Repartidores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NombreUsuario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    NombreCompleto = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Rol = table.Column<string>(type: "text", nullable: false),
                    RepartidorId = table.Column<int>(type: "integer", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ZonaId = table.Column<int>(type: "integer", nullable: true),
                    TipoClienteId = table.Column<int>(type: "integer", nullable: true),
                    ListaPrecioId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_ListasPrecios_ListaPrecioId",
                        column: x => x.ListaPrecioId,
                        principalTable: "ListasPrecios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Clientes_TiposCliente_TipoClienteId",
                        column: x => x.TipoClienteId,
                        principalTable: "TiposCliente",
                        principalColumn: "Id");
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
                    RepartidorId = table.Column<int>(type: "integer", nullable: false),
                    ZonaId = table.Column<int>(type: "integer", nullable: false)
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
                    ComboId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false)
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
                name: "ListasPreciosDetalle",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ListaPrecioId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Precio = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NumeroTicket = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    ClienteId = table.Column<int>(type: "integer", nullable: true),
                    NombreCliente = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TelefonoCliente = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DireccionEntrega = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ZonaId = table.Column<int>(type: "integer", nullable: true),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Descuento = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Recargo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FormaPagoId = table.Column<int>(type: "integer", nullable: true),
                    RepartidorId = table.Column<int>(type: "integer", nullable: true),
                    CierreCajaId = table.Column<int>(type: "integer", nullable: true),
                    FechaProgramada = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    FechaAsignacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    FechaEntrega = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    NotasEntrega = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NotaInterna = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TipoFactura = table.Column<int>(type: "integer", nullable: false),
                    EstaPago = table.Column<bool>(type: "boolean", nullable: false),
                    ComprobanteEntrega = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_CierresCaja_CierreCajaId",
                        column: x => x.CierreCajaId,
                        principalTable: "CierresCaja",
                        principalColumn: "Id");
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PedidoId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: true),
                    ComboId = table.Column<int>(type: "integer", nullable: true),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Notas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
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

            migrationBuilder.CreateTable(
                name: "PagosPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PedidoId = table.Column<int>(type: "integer", nullable: false),
                    FormaPagoId = table.Column<int>(type: "integer", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PorcentajeRecargo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Recargo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalACobrar = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
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

            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Activa", "CategoriaPadreId", "Nombre", "SeccionCamioneta" },
                values: new object[,]
                {
                    { 10, true, null, "Salchicha Corta", 2 },
                    { 11, true, null, "Salchicha Larga", 3 },
                    { 12, true, null, "Pan Tradicional", 4 },
                    { 13, true, null, "Pan Maxi", 5 },
                    { 14, true, null, "Pan Pancho", 6 },
                    { 15, true, null, "Pan Super Pancho", 7 },
                    { 16, true, null, "Aderezos", 8 },
                    { 17, true, null, "Económica", 10 },
                    { 18, true, null, "Premium", 10 }
                });

            migrationBuilder.InsertData(
                table: "Combos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "Nombre", "Precio" },
                values: new object[,]
                {
                    { 1, true, null, "Media eco 69gr con pan y aderezo", "30 Hamburguesas 69gr Eco C/Pan + ADD", 22000m },
                    { 2, true, null, "Media eco 80gr con pan y aderezo", "30 Hamburguesas 80gr Eco C/Pan + ADD", 27000m },
                    { 3, true, null, "Media eco 110gr con pan y aderezo", "20 Hamburguesas 110gr Eco C/Pan + ADD", 24000m },
                    { 4, true, null, "Media premium 80gr", "30 Hamburguesas 80gr Premium C/Pan + ADD", 38000m },
                    { 5, true, null, "Media premium 110gr", "20 Hamburguesas 110gr Premium C/Pan + ADD", 34000m },
                    { 6, true, null, "Media premium 120gr", "20 Hamburguesas 120gr Premium C/Pan + ADD", 40000m },
                    { 7, true, null, "Media premium 160gr", "12 Hamburguesas 160gr Premium C/Pan + ADD", 35000m },
                    { 8, true, null, "Media premium 198gr", "12 Hamburguesas 198gr Premium C/Pan + ADD", 42000m },
                    { 9, true, null, "Bulto cerrado eco 69gr", "60 Hamburguesas 69gr Eco C/Pan", 38000m },
                    { 10, true, null, "Bulto cerrado eco 80gr", "60 Hamburguesas 80gr Eco C/Pan", 48000m },
                    { 11, true, null, "Bulto cerrado eco 110gr", "40 Hamburguesas 110gr Eco C/Pan", 44000m },
                    { 12, true, null, "Bulto cerrado premium 80gr", "60 Hamburguesas 80gr Premium C/Pan", 72000m },
                    { 13, true, null, "Bulto cerrado premium 110gr", "40 Hamburguesas 110gr Premium C/Pan", 64000m },
                    { 14, true, null, "Bulto cerrado premium 120gr", "40 Hamburguesas 120gr Premium C/Pan", 76000m },
                    { 15, true, null, "Bulto cerrado premium 160gr", "24 Hamburguesas 160gr Premium C/Pan", 65000m },
                    { 16, true, null, "Bulto cerrado premium 198gr", "24 Hamburguesas 198gr Premium C/Pan", 80000m },
                    { 17, true, null, "Bulto 55gr con pan tradicional", "72 Hamburguesas 55gr Eco C/Pan", 32000m },
                    { 18, true, null, "Bulto 55gr sin pan ni aderezo", "72 Hamburguesas 55gr Eco S/Pan", 26000m },
                    { 19, true, null, "Media salchicha corta", "30 Panchos C/Pan + ADD", 18000m },
                    { 20, true, null, "Bulto salchicha corta", "60 Panchos C/Pan + ADD", 32000m },
                    { 21, true, null, "Media salchicha larga", "36 Super Panchos C/Pan + ADD", 28000m },
                    { 22, true, null, "Bulto salchicha larga", "60 Super Panchos C/Pan + ADD", 45000m }
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
                    { 2, true, "5678", "María García", "11-8765-4321", "Bicicleta" },
                    { 3, true, "9999", "Nico Flores", "11-0000-0000", "Moto" }
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
                table: "Categorias",
                columns: new[] { "Id", "Activa", "CategoriaPadreId", "Nombre", "SeccionCamioneta" },
                values: new object[,]
                {
                    { 1, true, 17, "Hamburguesa Económica 55gr", 0 },
                    { 2, true, 17, "Hamburguesa Económica 69gr", 0 },
                    { 3, true, 17, "Hamburguesa Económica 80gr", 0 },
                    { 4, true, 17, "Hamburguesa Económica 110gr", 0 },
                    { 5, true, 18, "Hamburguesa Premium 80gr", 1 },
                    { 6, true, 18, "Hamburguesa Premium 110gr", 1 },
                    { 7, true, 18, "Hamburguesa Premium 120gr", 1 },
                    { 8, true, 18, "Hamburguesa Premium 160gr", 1 },
                    { 9, true, 18, "Hamburguesa Premium 198gr", 1 }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Marca", "Nombre", "NumeroInterno", "PesoGramos", "Precio", "UnidadesPorBulto", "UnidadesPorMedia" },
                values: new object[,]
                {
                    { 10, true, 10, null, null, "Jetfood", "Salchicha Corta", null, null, 350m, 60, 30 },
                    { 11, true, 11, null, null, "Delosan", "Salchicha Larga", null, null, 500m, 60, 36 }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Marca", "Nombre", "NumeroInterno", "PesoGramos", "Precio", "UnidadesPorBulto" },
                values: new object[,]
                {
                    { 12, true, 12, null, null, null, "Pan Tradicional", null, null, 1200m, 6 },
                    { 13, true, 13, null, null, null, "Pan Maxi", null, null, 1500m, 6 },
                    { 14, true, 14, null, null, null, "Pan Pancho", null, null, 1000m, 6 },
                    { 15, true, 15, null, null, null, "Pan Super Pancho", null, null, 1400m, 6 },
                    { 16, true, 16, null, null, "Benidor", "Aderezo Benidor", null, null, 2500m, 1 }
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
                    { 4, true, "María García", "repartidor2", "$2a$11$W8Sz4uInizUbeN7QyFxus.yY5OeJjg1FpWxkbaweuNyzCipCAF87u", 2, "Repartidor" },
                    { 5, true, "Nico Flores", "nico", "$2a$11$k8abIU/DHMapQlOJM1JCe.MsfWKeOI0UtDTfemLVgPRESrFAhYbdu", 3, "Repartidor" }
                });

            migrationBuilder.InsertData(
                table: "ComboDetalles",
                columns: new[] { "ComboId", "ProductoId", "Cantidad" },
                values: new object[,]
                {
                    { 1, 12, 30 },
                    { 1, 16, 1 },
                    { 2, 12, 30 },
                    { 2, 16, 1 },
                    { 3, 13, 20 },
                    { 3, 16, 1 },
                    { 4, 12, 30 },
                    { 4, 16, 1 },
                    { 5, 13, 20 },
                    { 5, 16, 1 },
                    { 6, 13, 20 },
                    { 6, 16, 1 },
                    { 7, 13, 12 },
                    { 7, 16, 1 },
                    { 8, 13, 12 },
                    { 8, 16, 1 },
                    { 9, 12, 60 },
                    { 10, 12, 60 },
                    { 11, 13, 40 },
                    { 12, 12, 60 },
                    { 13, 13, 40 },
                    { 14, 13, 40 },
                    { 15, 13, 24 },
                    { 16, 13, 24 },
                    { 17, 12, 72 },
                    { 19, 10, 30 },
                    { 19, 14, 30 },
                    { 19, 16, 1 },
                    { 20, 10, 60 },
                    { 20, 14, 60 },
                    { 20, 16, 1 },
                    { 21, 11, 36 },
                    { 21, 15, 36 },
                    { 21, 16, 1 },
                    { 22, 11, 60 },
                    { 22, 15, 60 },
                    { 22, 16, 1 }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Activo", "CategoriaId", "Descripcion", "ImagenUrl", "Marca", "Nombre", "NumeroInterno", "PesoGramos", "Precio", "UnidadesPorBulto", "UnidadesPorMedia" },
                values: new object[,]
                {
                    { 1, true, 1, null, null, "La Defensa", "Hamburguesa Eco 55gr", null, 55, 300m, 72, 36 },
                    { 2, true, 2, null, null, "La Conquista", "Hamburguesa Eco 69gr", null, 69, 450m, 60, 30 },
                    { 3, true, 3, null, null, "Rancho Alto", "Hamburguesa Eco 80gr", null, 80, 550m, 60, 30 },
                    { 4, true, 4, null, null, "La Defensa", "Hamburguesa Eco 110gr", null, 110, 750m, 40, 20 },
                    { 5, true, 5, null, null, "Finexcor", "Hamburguesa Premium 80gr", null, 80, 850m, 60, 30 },
                    { 6, true, 6, null, null, "Finexcor", "Hamburguesa Premium 110gr", null, 110, 1100m, 40, 20 },
                    { 7, true, 7, null, null, "Finexcor", "Hamburguesa Premium 120gr", null, 120, 1300m, 40, 20 },
                    { 8, true, 8, null, null, "Finexcor", "Hamburguesa Premium 160gr", null, 160, 1800m, 24, 12 },
                    { 9, true, 9, null, null, "Friar", "Hamburguesa Premium 198gr", null, 198, 2200m, 24, 12 }
                });

            migrationBuilder.InsertData(
                table: "ComboDetalles",
                columns: new[] { "ComboId", "ProductoId", "Cantidad" },
                values: new object[,]
                {
                    { 1, 2, 30 },
                    { 2, 3, 30 },
                    { 3, 4, 20 },
                    { 4, 5, 30 },
                    { 5, 6, 20 },
                    { 6, 7, 20 },
                    { 7, 8, 12 },
                    { 8, 9, 12 },
                    { 9, 2, 60 },
                    { 10, 3, 60 },
                    { 11, 4, 40 },
                    { 12, 5, 60 },
                    { 13, 6, 40 },
                    { 14, 7, 40 },
                    { 15, 8, 24 },
                    { 16, 9, 24 },
                    { 17, 1, 72 },
                    { 18, 1, 72 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_CategoriaPadreId",
                table: "Categorias",
                column: "CategoriaPadreId");

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
                name: "IX_Clientes_ListaPrecioId",
                table: "Clientes",
                column: "ListaPrecioId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_TipoClienteId",
                table: "Clientes",
                column: "TipoClienteId");

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
                name: "IX_Mensajes_RepartidorId",
                table: "Mensajes",
                column: "RepartidorId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_RepartidorId_Leido",
                table: "Mensajes",
                columns: new[] { "RepartidorId", "Leido" });

            migrationBuilder.CreateIndex(
                name: "IX_PagosPedido_FormaPagoId",
                table: "PagosPedido",
                column: "FormaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosPedido_PedidoId",
                table: "PagosPedido",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_CierreCajaId",
                table: "Pedidos",
                column: "CierreCajaId");

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
                name: "IX_Pedidos_FechaProgramada",
                table: "Pedidos",
                column: "FechaProgramada");

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
                name: "IX_UbicacionesRepartidor_EstaActivo",
                table: "UbicacionesRepartidor",
                column: "EstaActivo");

            migrationBuilder.CreateIndex(
                name: "IX_UbicacionesRepartidor_RepartidorId",
                table: "UbicacionesRepartidor",
                column: "RepartidorId",
                unique: true);

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
                name: "CierresCajaDetalle");

            migrationBuilder.DropTable(
                name: "ComboDetalles");

            migrationBuilder.DropTable(
                name: "LineasPedido");

            migrationBuilder.DropTable(
                name: "ListasPreciosDetalle");

            migrationBuilder.DropTable(
                name: "Mensajes");

            migrationBuilder.DropTable(
                name: "PagosPedido");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DropTable(
                name: "RepartidorZonas");

            migrationBuilder.DropTable(
                name: "UbicacionesRepartidor");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Combos");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropTable(
                name: "CierresCaja");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "FormasPago");

            migrationBuilder.DropTable(
                name: "Repartidores");

            migrationBuilder.DropTable(
                name: "ListasPrecios");

            migrationBuilder.DropTable(
                name: "TiposCliente");

            migrationBuilder.DropTable(
                name: "Zonas");
        }
    }
}
