import api from './client';
import { Pedido, Repartidor, Zona } from '../types';

export const getZonas = () => api.get<Zona[]>('/zonas').then(r => r.data);
export const createZona = (data: { nombre: string; descripcion?: string; costoEnvio: number }) => api.post<Zona>('/zonas', data).then(r => r.data);
export const updateZona = (id: number, data: { nombre: string; descripcion?: string; costoEnvio: number; activa: boolean }) => api.put<Zona>(`/zonas/${id}`, data).then(r => r.data);
export const deleteZona = (id: number) => api.delete(`/zonas/${id}`);

export const getRepartidores = () => api.get<Repartidor[]>('/repartidores').then(r => r.data);
export const createRepartidor = (data: { nombre: string; telefono?: string; vehiculo?: string; codigoAcceso: string }) => api.post<Repartidor>('/repartidores', data).then(r => r.data);
export const updateRepartidor = (id: number, data: { nombre: string; telefono?: string; vehiculo?: string; activo: boolean; codigoAcceso?: string }) => api.put<Repartidor>(`/repartidores/${id}`, data).then(r => r.data);
export const deleteRepartidor = (id: number) => api.delete(`/repartidores/${id}`);
export const asignarZonas = (id: number, zonaIds: number[]) => api.put<Repartidor>(`/repartidores/${id}/zonas`, { zonaIds }).then(r => r.data);

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
export const finalizarRepartoZona = (zonaId: number) => api.post(`/entregas/finalizar-reparto/${zonaId}`).then(r => r.data);
export const getZonasFinalizadas = () => api.get<number[]>('/entregas/zonas-finalizadas').then(r => r.data);
export const empezarReparto = (asignaciones: { zonaId: number; repartidorId: number }[]) =>
  api.post('/entregas/empezar-reparto', { asignaciones }).then(r => r.data);

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
