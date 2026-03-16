import api from './client';

export interface RendicionDetalleDto {
  id: number;
  pedidoId: number;
  numeroTicket: string;
  estado: string;
  formaPago?: string;
  total: number;
}

export interface RendicionZonaDto {
  zonaId: number;
  zonaNombre: string;
  totalPedidos: number;
  totalEntregados: number;
  totalNoEntregados: number;
  totalCancelados: number;
}

export interface RendicionDto {
  id: number;
  repartidorId: number;
  repartidorNombre: string;
  fecha: string;
  totalEfectivo: number;
  totalTransferencia: number;
  totalNoEntregado: number;
  cantidadEntregados: number;
  cantidadNoEntregados: number;
  efectivoDeclarado: number;
  diferencia: number;
  observaciones?: string;
  aprobada: boolean;
  fechaAprobacion?: string;
  detalles: RendicionDetalleDto[];
  zonas: RendicionZonaDto[];
}

export const crearRendicion = (data: { repartidorId: number; efectivoDeclarado: number; observaciones?: string }) =>
  api.post<RendicionDto>('/rendiciones', data).then(r => r.data);

export const getRendiciones = (fecha?: string) =>
  api.get<RendicionDto[]>('/rendiciones', { params: { fecha } }).then(r => r.data);

export const getRendicionesRepartidor = (id: number) =>
  api.get<RendicionDto[]>(`/rendiciones/repartidor/${id}`).then(r => r.data);

export const getRendicion = (id: number) =>
  api.get<RendicionDto>(`/rendiciones/${id}`).then(r => r.data);

export const aprobarRendicion = (id: number, data: { aprobada: boolean; observaciones?: string }) =>
  api.put<RendicionDto>(`/rendiciones/${id}/aprobar`, data).then(r => r.data);

export const getEstadoRepartoRepartidor = (repartidorId: number) =>
  api.get<{ zonasFinalizadas: boolean; zonas: RendicionZonaDto[] }>(`/rendiciones/estado-reparto/${repartidorId}`).then(r => r.data);
