import api from './client';
import { CierreCaja, AbrirCajaDto, CerrarCajaDto } from '../types';

export const getCajaAbierta = (localId?: number) =>
  api.get<CierreCaja>('/caja/abierta', { params: localId ? { localId } : {} }).then(r => r.data).catch(() => null);

export const abrirCaja = (data: AbrirCajaDto) =>
  api.post<CierreCaja>('/caja/abrir', data).then(r => r.data);

export const cerrarCaja = (id: number, data: CerrarCajaDto) =>
  api.put<CierreCaja>(`/caja/${id}/cerrar`, data).then(r => r.data);

export const getHistorialCajas = (localId?: number, fechaDesde?: string, fechaHasta?: string) => {
  const params: Record<string, string | number> = {};
  if (localId) params.localId = localId;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;
  return api.get<CierreCaja[]>('/caja', { params }).then(r => r.data);
};

export const getCaja = (id: number) =>
  api.get<CierreCaja>(`/caja/${id}`).then(r => r.data);
