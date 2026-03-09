import api from './client';
import { Pedido, TipoPedido } from '../types';

export const getPedidos = (fecha?: string, estado?: number) =>
  api.get<Pedido[]>('/pedidos', { params: { fecha, estado } }).then(r => r.data);

export const getPedido = (id: number) => api.get<Pedido>(`/pedidos/${id}`).then(r => r.data);

export const crearPedido = (data: {
  tipo: TipoPedido;
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
  pagos?: { formaPagoId: number; monto: number }[];
  lineas: { productoId?: number; comboId?: number; cantidad: number; precioUnitario: number; notas?: string }[];
}) => api.post<Pedido>('/pedidos', data).then(r => r.data);

export const cambiarEstado = (id: number, nuevoEstado: number) =>
  api.put<Pedido>(`/pedidos/${id}/estado`, { nuevoEstado }).then(r => r.data);

export const cancelarPedido = (id: number) => api.put<Pedido>(`/pedidos/${id}/cancelar`).then(r => r.data);

export const actualizarPedido = (id: number, data: any) =>
  api.put<Pedido>(`/pedidos/${id}`, data).then(r => r.data);

export const getTicket = (id: number) => api.get(`/pedidos/${id}/ticket`).then(r => r.data);

export const prepararTodos = () => api.put('/pedidos/preparar-todos').then(r => r.data);
