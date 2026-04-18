import api from './client';
import { Venta, TipoVenta } from '../types';

export const getVentas = (fecha?: string, estado?: number, fechaHasta?: string, localId?: number) =>
  api.get<Venta[]>('/ventas', { params: { fecha, fechaHasta, estado, localId } }).then(r => r.data);

export const getVenta = (id: number) => api.get<Venta>(`/ventas/${id}`).then(r => r.data);

export const crearVenta = (data: {
  tipo: TipoVenta;
  nombreCliente?: string;
  telefonoCliente?: string;
  direccionEntrega?: string;
  zonaId?: number;
  descuento: number;
  formaPagoId?: number;
  clienteId?: number;
  notaInterna?: string;
  tipoFactura?: number;
  fechaProgramada?: string;
  estaPago?: boolean;
  localId?: number;
  pagos?: { formaPagoId: number; monto: number }[];
  lineas: { productoId?: number; comboId?: number; cantidad: number; precioUnitario: number; notas?: string }[];
}) => api.post<Venta>('/ventas', data).then(r => r.data);

export const cambiarEstado = (id: number, nuevoEstado: number) =>
  api.put<Venta>(`/ventas/${id}/estado`, { nuevoEstado }).then(r => r.data);

export const cancelarVenta = (id: number, motivo: string) => api.put<Venta>(`/ventas/${id}/cancelar`, { motivo }).then(r => r.data);

export const actualizarVenta = (id: number, data: Partial<Parameters<typeof crearVenta>[0]>) =>
  api.put<Venta>(`/ventas/${id}`, data).then(r => r.data);

export const getTicket = (id: number) => api.get(`/ventas/${id}/ticket`).then(r => r.data);

export const prepararTodos = () => api.put('/ventas/preparar-todos').then(r => r.data);

export const enviarADeposito = (id: number) => api.post(`/ventas/${id}/enviar-deposito`).then(r => r.data);
export const asignarCaja = (id: number) => api.put<Venta>(`/ventas/${id}/asignar-caja`).then(r => r.data);

export const cambiarEstadoPedido = (id: number, nuevoEstado: number, motivo?: string, formaPagoId?: number, pagos?: { formaPagoId: number; monto: number }[]) =>
  api.put<Venta>(`/ventas/${id}/cambiar-estado`, { nuevoEstado, motivo, formaPagoId, pagos }).then(r => r.data);

export interface VentaStats {
  ventasHoy: number;
  ventasAyer: number;
  porcentajeVariacionAyer: number;
  ventasUltimos7Dias: number;
  porcentajeVariacion7Dias: number;
  ventasAnioAnterior: number;
  porcentajeVariacionAnio: number;
  totalVentasFecha: number;
  ticketPromedio: number;
  totalBruto: number;
}

export const getVentaStats = (fecha?: string, localId?: number, tipo?: number) =>
  api.get<VentaStats>('/ventas/stats', { params: { fecha, localId, tipo } }).then(r => r.data);

// Aliases para compatibilidad con código que aún usa nombres anteriores
export const getPedidos = getVentas;
export const getPedido = getVenta;
export const crearPedido = crearVenta;
export const cancelarPedido = cancelarVenta;
export const actualizarPedido = actualizarVenta;
export const getPedidoStats = getVentaStats;
export type PedidoStats = VentaStats;
