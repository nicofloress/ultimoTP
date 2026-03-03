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
export const marcarEntregado = (pedidoId: number, notas?: string) => api.put<Pedido>(`/entregas/${pedidoId}/entregar`, JSON.stringify(notas || ''), { headers: { 'Content-Type': 'application/json' } }).then(r => r.data);

export const loginRepartidor = (codigoAcceso: string) => api.post<{ id: number; nombre: string }>('/auth/repartidor', { codigoAcceso }).then(r => r.data);
