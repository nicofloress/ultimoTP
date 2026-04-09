import api from './client';
import { Venta } from '../types';

export const getEntregasPendientes = () => api.get<Venta[]>('/entregas/pendientes').then(r => r.data);
export const asignarEntrega = (ventaId: number, repartidorId: number) => api.post<Venta>('/entregas/asignar', { pedidoId: ventaId, repartidorId }).then(r => r.data);
export const getEntregasRepartidor = (id: number) => api.get<Venta[]>(`/entregas/repartidor/${id}`).then(r => r.data);
export const marcarEnCamino = (ventaId: number) => api.put<Venta>(`/entregas/${ventaId}/en-camino`).then(r => r.data);
export const marcarEntregado = (ventaId: number, data: { notas?: string; formaPagoId?: number; comprobanteBase64?: string }) =>
  api.put<Venta>(`/entregas/${ventaId}/entregar`, data).then(r => r.data);

export const loginRepartidor = (codigoAcceso: string) => api.post<{ id: number; nombre: string }>('/auth/repartidor', { codigoAcceso }).then(r => r.data);

export const marcarNoEntregado = (ventaId: number, motivo: string) =>
  api.put<Venta>(`/entregas/${ventaId}/no-entregado`, { motivo }).then(r => r.data);

export const getPedidosPorZona = () => api.get<Venta[]>('/entregas/por-zona').then(r => r.data);
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
  repartidorLocalId?: number;
  nombre: string;
  vehiculo: string | null;
  fecha: string;
  totalPedidos: number;
  medallones: Record<string, CompletaMedia>;
  premium: Record<string, CompletaMedia>;
  salchichaCorta: Record<string, number>;
  salchichaLarga: Record<string, number>;
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

export interface ControlCamionetaHistorialItem {
  repartoZonaId: number;
  zonaNombre: string;
  repartidorNombre: string;
  repartidorVehiculo: string | null;
  repartidorLocalId?: number;
  fechaInicio: string;
  fechaFinalizacion: string | null;
  totalVentas: number;
  totalEntregados: number;
  totalNoEntregados: number;
  totalCancelados: number;
  tally: RepartidorTally | null;
}

export interface ControlCamionetaHistorial {
  items: ControlCamionetaHistorialItem[];
}

export const getControlCamionetaHistorial = (fecha: string) =>
  api.get<ControlCamionetaHistorial>(`/entregas/control-camioneta/historial?fecha=${fecha}`).then(r => r.data);

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
