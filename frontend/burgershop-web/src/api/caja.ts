import api from './client';
import { CierreCaja, AbrirCajaDto, CerrarCajaDto } from '../types';

export const getCajaAbierta = () =>
  api.get<CierreCaja>('/caja/abierta').then(r => r.data).catch(() => null);

export const abrirCaja = (data: AbrirCajaDto) =>
  api.post<CierreCaja>('/caja/abrir', data).then(r => r.data);

export const cerrarCaja = (id: number, data: CerrarCajaDto) =>
  api.put<CierreCaja>(`/caja/${id}/cerrar`, data).then(r => r.data);

export const getHistorialCajas = () =>
  api.get<CierreCaja[]>('/caja').then(r => r.data);

export const getCaja = (id: number) =>
  api.get<CierreCaja>(`/caja/${id}`).then(r => r.data);
