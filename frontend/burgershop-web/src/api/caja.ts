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

export interface RevisarCajaDto {
  resultado: number; // 1=SinDiferencia, 2=DiferenciaLeve, 3=DiferenciaGrave
  observaciones?: string;
}

export const getPendientesRevision = (localId?: number) =>
  api.get<CierreCaja[]>('/caja/pendientes', { params: localId ? { localId } : {} }).then(r => r.data);

export const revisarCaja = (id: number, data: RevisarCajaDto) =>
  api.put<CierreCaja>(`/caja/${id}/revisar`, data).then(r => r.data);

export interface VentaCajaDto {
  id: number;
  numeroTicket: string;
  tipo: number; // 1=Mostrador, 2=Domicilio
  total: number;
  formaPagoNombre: string;
  estaPago: boolean;
}

export const getVentasCaja = (id: number) =>
  api.get<VentaCajaDto[]>(`/caja/${id}/ventas`).then(r => r.data);
