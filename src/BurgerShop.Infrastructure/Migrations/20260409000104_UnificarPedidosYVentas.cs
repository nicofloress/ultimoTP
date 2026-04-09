using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BurgerShop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UnificarPedidosYVentas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================================
            // PASO 1: Agregar columnas faltantes a Pedidos (UsuarioId, Observaciones)
            // ============================================================
            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Pedidos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "Pedidos",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            // ============================================================
            // PASO 2: Migrar datos de Ventas (simples) → Pedidos
            // Las ventas mostrador pasan como Tipo=1 (Mostrador), Estado=6 (Entregado)
            // ============================================================
            migrationBuilder.Sql(@"
                INSERT INTO ""Pedidos"" (
                    ""NumeroTicket"", ""FechaCreacion"", ""Tipo"", ""Estado"", ""LocalId"",
                    ""ClienteId"", ""NombreCliente"", ""TelefonoCliente"",
                    ""Subtotal"", ""Descuento"", ""Recargo"", ""Total"",
                    ""FormaPagoId"", ""EstaPago"", ""TipoFactura"",
                    ""UsuarioId"", ""Observaciones""
                )
                SELECT
                    ""NumeroVenta"", ""Fecha"", 1, 6, ""LocalId"",
                    ""ClienteId"", ""NombreCliente"", ""TelefonoCliente"",
                    ""Subtotal"", ""Descuento"", ""Recargo"", ""Total"",
                    ""FormaPagoId"", ""EstaPago"", 2,
                    ""UsuarioId"", ""Observaciones""
                FROM ""Ventas""
            ");

            // Migrar VentaDetalles → LineasPedido (mapeando VentaId al nuevo PedidoId)
            migrationBuilder.Sql(@"
                INSERT INTO ""LineasPedido"" (
                    ""PedidoId"", ""ProductoId"", ""ComboId"", ""Descripcion"",
                    ""Cantidad"", ""PrecioUnitario"", ""Subtotal"", ""Notas""
                )
                SELECT
                    p.""Id"", vd.""ProductoId"", vd.""ComboId"", vd.""Descripcion"",
                    vd.""Cantidad"", vd.""PrecioUnitario"", vd.""Subtotal"", vd.""Notas""
                FROM ""VentaDetalles"" vd
                INNER JOIN ""Ventas"" v ON vd.""VentaId"" = v.""Id""
                INNER JOIN ""Pedidos"" p ON p.""NumeroTicket"" = v.""NumeroVenta""
            ");

            // Migrar PagosVenta → PagosPedido
            migrationBuilder.Sql(@"
                INSERT INTO ""PagosPedido"" (
                    ""PedidoId"", ""FormaPagoId"", ""Monto"",
                    ""PorcentajeRecargo"", ""Recargo"", ""TotalACobrar""
                )
                SELECT
                    p.""Id"", pv.""FormaPagoId"", pv.""Monto"",
                    pv.""PorcentajeRecargo"", pv.""Recargo"", pv.""TotalACobrar""
                FROM ""PagosVenta"" pv
                INNER JOIN ""Ventas"" v ON pv.""VentaId"" = v.""Id""
                INNER JOIN ""Pedidos"" p ON p.""NumeroTicket"" = v.""NumeroVenta""
            ");

            // Actualizar Movimientos que apuntaban a la vieja tabla Ventas via PedidoId
            // (los movimientos del POS se registraban con PedidoId de la tabla Pedidos,
            // no de la tabla Ventas, así que no hay nada que remap aquí)

            // ============================================================
            // PASO 3: Dropear FKs que apuntan a Ventas vieja, luego dropear tablas
            // ============================================================

            // FK de MovimientosCuentaCorriente.VentaId → Ventas
            migrationBuilder.Sql(@"
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_MovimientosCuentaCorriente_Ventas_VentaId') THEN
                        ALTER TABLE ""MovimientosCuentaCorriente"" DROP CONSTRAINT ""FK_MovimientosCuentaCorriente_Ventas_VentaId"";
                    END IF;
                END $$;
            ");

            // FK de Ventas.PedidoId → Pedidos (self-referencing from old schema)
            migrationBuilder.Sql(@"
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_Ventas_Pedidos_PedidoId') THEN
                        ALTER TABLE ""Ventas"" DROP CONSTRAINT ""FK_Ventas_Pedidos_PedidoId"";
                    END IF;
                END $$;
            ");

            // FK de Ventas.ClienteId, FormaPagoId, LocalId, UsuarioId
            migrationBuilder.Sql(@"
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_Ventas_Clientes_ClienteId') THEN
                        ALTER TABLE ""Ventas"" DROP CONSTRAINT ""FK_Ventas_Clientes_ClienteId"";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_Ventas_FormasPago_FormaPagoId') THEN
                        ALTER TABLE ""Ventas"" DROP CONSTRAINT ""FK_Ventas_FormasPago_FormaPagoId"";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_Ventas_Locales_LocalId') THEN
                        ALTER TABLE ""Ventas"" DROP CONSTRAINT ""FK_Ventas_Locales_LocalId"";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                               WHERE constraint_name = 'FK_Ventas_Usuarios_UsuarioId') THEN
                        ALTER TABLE ""Ventas"" DROP CONSTRAINT ""FK_Ventas_Usuarios_UsuarioId"";
                    END IF;
                END $$;
            ");

            migrationBuilder.DropTable(name: "PagosVenta");
            migrationBuilder.DropTable(name: "VentaDetalles");
            migrationBuilder.DropTable(name: "Ventas");

            // ============================================================
            // PASO 4: Renombrar tablas Pedidos → Ventas
            // ============================================================
            migrationBuilder.RenameTable(name: "Pedidos", newName: "Ventas");
            migrationBuilder.RenameTable(name: "LineasPedido", newName: "LineasVenta");
            migrationBuilder.RenameTable(name: "PagosPedido", newName: "PagosVenta");

            // ============================================================
            // PASO 5: Renombrar columnas PedidoId → VentaId en tablas relacionadas
            // ============================================================

            // LineasVenta: PedidoId → VentaId
            migrationBuilder.RenameColumn(
                name: "PedidoId",
                table: "LineasVenta",
                newName: "VentaId");

            // PagosVenta: PedidoId → VentaId
            migrationBuilder.RenameColumn(
                name: "PedidoId",
                table: "PagosVenta",
                newName: "VentaId");

            // Movimientos: PedidoId → VentaId
            migrationBuilder.DropForeignKey(
                name: "FK_Movimientos_Pedidos_PedidoId",
                table: "Movimientos");

            migrationBuilder.RenameColumn(
                name: "PedidoId",
                table: "Movimientos",
                newName: "VentaId");

            migrationBuilder.RenameIndex(
                name: "IX_Movimientos_PedidoId",
                table: "Movimientos",
                newName: "IX_Movimientos_VentaId");

            // RendicionesDetalle: PedidoId → VentaId
            migrationBuilder.DropForeignKey(
                name: "FK_RendicionesDetalle_Pedidos_PedidoId",
                table: "RendicionesDetalle");

            migrationBuilder.RenameColumn(
                name: "PedidoId",
                table: "RendicionesDetalle",
                newName: "VentaId");

            migrationBuilder.RenameIndex(
                name: "IX_RendicionesDetalle_PedidoId",
                table: "RendicionesDetalle",
                newName: "IX_RendicionesDetalle_VentaId");

            // MovimientosCuentaCorriente: drop PedidoId column (redundant with VentaId)
            migrationBuilder.DropForeignKey(
                name: "FK_MovimientosCuentaCorriente_Pedidos_PedidoId",
                table: "MovimientosCuentaCorriente");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosCuentaCorriente_PedidoId",
                table: "MovimientosCuentaCorriente");

            migrationBuilder.DropColumn(
                name: "PedidoId",
                table: "MovimientosCuentaCorriente");

            // Update VentaId index on MovimientosCuentaCorriente
            migrationBuilder.DropIndex(
                name: "IX_MovimientosCuentaCorriente_VentaId",
                table: "MovimientosCuentaCorriente");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosCuentaCorriente_VentaId",
                table: "MovimientosCuentaCorriente",
                column: "VentaId",
                filter: "\"VentaId\" IS NOT NULL");

            // RepartosZona: TotalPedidos → TotalVentas
            migrationBuilder.RenameColumn(
                name: "TotalPedidos",
                table: "RepartosZona",
                newName: "TotalVentas");

            // ============================================================
            // PASO 6: Renombrar FKs e índices de Ventas (ex-Pedidos)
            // ============================================================

            // Renombrar PKs e índices
            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_CierreCajaId",
                table: "Ventas",
                newName: "IX_Ventas_CierreCajaId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Ventas",
                newName: "IX_Ventas_ClienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_Estado",
                table: "Ventas",
                newName: "IX_Ventas_Estado");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_FechaCreacion",
                table: "Ventas",
                newName: "IX_Ventas_FechaCreacion");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_FechaProgramada",
                table: "Ventas",
                newName: "IX_Ventas_FechaProgramada");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_FormaPagoId",
                table: "Ventas",
                newName: "IX_Ventas_FormaPagoId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_LocalId",
                table: "Ventas",
                newName: "IX_Ventas_LocalId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_NumeroTicket",
                table: "Ventas",
                newName: "IX_Ventas_NumeroTicket");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_RepartidorId",
                table: "Ventas",
                newName: "IX_Ventas_RepartidorId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_RepartoZonaId",
                table: "Ventas",
                newName: "IX_Ventas_RepartoZonaId");

            migrationBuilder.RenameIndex(
                name: "IX_Pedidos_ZonaId",
                table: "Ventas",
                newName: "IX_Ventas_ZonaId");

            // Renombrar índices de LineasVenta
            migrationBuilder.RenameIndex(
                name: "IX_LineasPedido_PedidoId",
                table: "LineasVenta",
                newName: "IX_LineasVenta_VentaId");

            migrationBuilder.RenameIndex(
                name: "IX_LineasPedido_ComboId",
                table: "LineasVenta",
                newName: "IX_LineasVenta_ComboId");

            migrationBuilder.RenameIndex(
                name: "IX_LineasPedido_ProductoId",
                table: "LineasVenta",
                newName: "IX_LineasVenta_ProductoId");

            // Renombrar índices de PagosVenta
            migrationBuilder.RenameIndex(
                name: "IX_PagosPedido_PedidoId",
                table: "PagosVenta",
                newName: "IX_PagosVenta_VentaId");

            migrationBuilder.RenameIndex(
                name: "IX_PagosPedido_FormaPagoId",
                table: "PagosVenta",
                newName: "IX_PagosVenta_FormaPagoId");

            // ============================================================
            // PASO 7: Recrear FKs con nombres correctos
            // ============================================================

            // Ventas FK a Movimientos
            migrationBuilder.AddForeignKey(
                name: "FK_Movimientos_Ventas_VentaId",
                table: "Movimientos",
                column: "VentaId",
                principalTable: "Ventas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // RendicionesDetalle FK a Ventas
            migrationBuilder.AddForeignKey(
                name: "FK_RendicionesDetalle_Ventas_VentaId",
                table: "RendicionesDetalle",
                column: "VentaId",
                principalTable: "Ventas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Ventas FK to Usuario
            migrationBuilder.CreateIndex(
                name: "IX_Ventas_UsuarioId",
                table: "Ventas",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ventas_Usuarios_UsuarioId",
                table: "Ventas",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down migration: reverse the process (simplified — data loss expected on rollback)

            // Drop new FKs
            migrationBuilder.DropForeignKey(name: "FK_Movimientos_Ventas_VentaId", table: "Movimientos");
            migrationBuilder.DropForeignKey(name: "FK_RendicionesDetalle_Ventas_VentaId", table: "RendicionesDetalle");
            migrationBuilder.DropForeignKey(name: "FK_Ventas_Usuarios_UsuarioId", table: "Ventas");
            migrationBuilder.DropIndex(name: "IX_Ventas_UsuarioId", table: "Ventas");

            // Rename back
            migrationBuilder.RenameColumn(name: "VentaId", table: "Movimientos", newName: "PedidoId");
            migrationBuilder.RenameIndex(name: "IX_Movimientos_VentaId", table: "Movimientos", newName: "IX_Movimientos_PedidoId");
            migrationBuilder.RenameColumn(name: "VentaId", table: "RendicionesDetalle", newName: "PedidoId");
            migrationBuilder.RenameIndex(name: "IX_RendicionesDetalle_VentaId", table: "RendicionesDetalle", newName: "IX_RendicionesDetalle_PedidoId");
            migrationBuilder.RenameColumn(name: "TotalVentas", table: "RepartosZona", newName: "TotalPedidos");

            // Rename tables back
            migrationBuilder.RenameTable(name: "Ventas", newName: "Pedidos");
            migrationBuilder.RenameTable(name: "LineasVenta", newName: "LineasPedido");
            migrationBuilder.RenameTable(name: "PagosVenta", newName: "PagosPedido");

            migrationBuilder.RenameColumn(name: "VentaId", table: "LineasPedido", newName: "PedidoId");
            migrationBuilder.RenameColumn(name: "VentaId", table: "PagosPedido", newName: "PedidoId");

            // Remove added columns
            migrationBuilder.DropColumn(name: "UsuarioId", table: "Pedidos");
            migrationBuilder.DropColumn(name: "Observaciones", table: "Pedidos");

            // Re-add PedidoId to MovimientosCuentaCorriente
            migrationBuilder.AddColumn<int>(
                name: "PedidoId",
                table: "MovimientosCuentaCorriente",
                type: "integer",
                nullable: true);
        }
    }
}
