import api from './client';
import { Pedido } from '../types';

export const getEntregasPendientes = () => api.get<Pedido[]>('/entregas/pendientes').then(r => r.data);
export const asignarEntrega = (pedidoId: number, repartidorId: number) => api.post<Pedido>('/entregas/asignar', { pedidoId, repartidorId }).then(r => r.data);
export const getEntregasRepartidor = (id: number) => api.get<Pedido[]>(`/entregas/repartidor/${id}`).then(r => r.data);
export const marcarEnCamino = (pedidoId: number) => api.put<Pedido>(`/entregas/${pedidoId}/en-camino`).then(r => r.data);
export const marcarEntregado = (pedidoId: number, data: { notas?: string; formaPagoId?: number; comprobanteBase64?: string }) =>
  api.put<Pedido>(`/entregas/${pedidoId}/entregar`, data).then(r => r.data);

export const loginRepartidor = (codigoAcceso: string) => api.post<{ id: number; nombre: string }>('/auth/repartidor', { codigoAcceso }).then(r => r.data);

export const marcarNoEntregado = (pedidoId: number, motivo: string) =>
  api.put<Pedido>(`/entregas/${pedidoId}/no-entregado`, { motivo }).then(r => r.data);

export const getPedidosPorZona = () => api.get<Pedido[]>('/entregas/por-zona').then(r => r.data);
export const finalizarRepartoZona = (zonaId: number, repartidorId: number) => api.post('/entregas/finalizar-reparto', { zonaId, repartidorId }).then(r => r.data);
export const empezarReparto = (asignaciones: { zonaId: number; repartidorId: number }[]) =>
  api.post('/entregas/empezar-reparto', { asignaciones }).then(r => r.data);

export interface CompletaMedia {
  completa: number;
  media: number;
  sueltos: number;
}

export interface RepartidorTally {
  repartidorId: number;
  nombre: string;
  vehiculo: string | null;
  fecha: string;
  totalPedidos: number;
  medallones: Record<string, CompletaMedia>;
  premium: Record<string, CompletaMedia>;
  salchichaCorta: CompletaMedia;
  salchichaLarga: CompletaMedia;
  panTradicional: Record<string, number>;
  panMaxi: Record<string, number>;
  panPancho: Record<string, number>;
  panSuperPancho: Record<string, number>;
  aderezos: Record<string, number>;
  otros: Record<string, number>;
  finalizado: boolean;
}

export interface ControlCamionetaData {
  repartidores: RepartidorTally[];
}

export const getControlCamioneta = () => api.get<ControlCamionetaData>('/entregas/control-camioneta').then(r => r.data);

export const descargarControlCamioneta = async (asignaciones: { zonaId: number; repartidorId: number }[]) => {
  const response = await api.post('/entregas/control-camioneta', { asignaciones }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `ControlCamionetas_${fecha}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
