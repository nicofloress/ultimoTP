import api from './client';

export interface VentaDto {
  id: number;
  numeroVenta: string;
  fecha: string;
  tipoVenta: number;
  clienteId?: number;
  nombreCliente?: string;
  telefonoCliente?: string;
  localId: number;
  localNombre: string;
  pedidoId?: number;
  numeroTicket?: string;
  formaPagoId?: number;
  formaPagoNombre?: string;
  subtotal: number;
  descuento: number;
  recargo: number;
  total: number;
  estaPago: boolean;
  usuarioId?: number;
  usuarioNombre?: string;
  observaciones?: string;
  detalles: VentaDetalleDto[];
  pagos?: PagoVentaDto[];
}

export interface VentaDetalleDto {
  id: number;
  productoId?: number;
  comboId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export interface PagoVentaDto {
  id: number;
  formaPagoId: number;
  formaPagoNombre: string;
  monto: number;
  porcentajeRecargo: number;
  recargo: number;
  totalACobrar: number;
}

export interface CrearVentaDto {
  tipoVenta: number;
  clienteId?: number;
  nombreCliente?: string;
  telefonoCliente?: string;
  localId: number;
  formaPagoId?: number;
  descuento: number;
  observaciones?: string;
  estaPago: boolean;
  detalles: { productoId?: number; comboId?: number; cantidad: number; precioUnitario: number; notas?: string }[];
  pagos?: { formaPagoId: number; monto: number }[];
}

export const crearVentaMostrador = (data: CrearVentaDto) =>
  api.post<VentaDto>('/ventas', data).then(r => r.data);

export const getVentas = (fecha?: string, fechaHasta?: string) =>
  api.get<VentaDto[]>('/ventas', { params: { fecha, fechaHasta } }).then(r => r.data);

export const getVenta = (id: number) =>
  api.get<VentaDto>(`/ventas/${id}`).then(r => r.data);

export const getVentaPorPedido = (pedidoId: number) =>
  api.get<VentaDto>(`/ventas/por-pedido/${pedidoId}`).then(r => r.data);
