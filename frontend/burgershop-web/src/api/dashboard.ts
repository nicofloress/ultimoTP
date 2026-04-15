import api from './client';

export interface TopProductoDto {
  nombre: string;
  cantidadVendida: number;
  montoTotal: number;
}

export interface StockCriticoDto {
  productoNombre: string;
  stockActual: number;
  stockMinimo: number | null;
}

export interface TopDeudorDto {
  clienteNombre: string;
  saldo: number;
}

export interface VentasPorLocalDto {
  localId: number;
  localNombre: string;
  cantidadVentas: number;
  montoTotal: number;
}

export interface DashboardDto {
  ventasMostradorHoy: number;
  montoMostradorHoy: number;
  ventasDomicilioHoy: number;
  montoDomicilioHoy: number;
  ticketPromedio: number;
  porcentajeVsAyer: number;
  cajaAbierta: boolean;
  montoCaja: number;
  topProductos: TopProductoDto[];
  productosStockCritico: number;
  productosSinStock: number;
  stockBajo: StockCriticoDto[];
  saldoCtaCteTotal: number;
  clientesConDeuda: number;
  topDeudores: TopDeudorDto[];
  pedidosPendientesEntrega: number;
  pedidosEntregadosHoy: number;
  comparativaLocales: VentasPorLocalDto[] | null;
}

export const getDashboard = (localId?: number) =>
  api.get<DashboardDto>('/dashboard', { params: { localId } }).then(r => r.data);
