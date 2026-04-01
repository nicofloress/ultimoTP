import api from './client';

export interface ArtiStockDto {
  productoId: number;
  productoNombre: string;
  localId: number;
  localNombre: string;
  ingresoLocal: number;
  egresoLocal: number;
  ventaLocal: number;
  stockFinal: number;
  stockMinimo?: number;
  ultimaModificacion: string;
  esPuntoVenta: boolean;
}

export const getStockPorLocal = (localId: number) =>
  api.get<ArtiStockDto[]>(`/stock/local/${localId}`).then(r => r.data);

export const getStockBajo = (localId: number) =>
  api.get<ArtiStockDto[]>(`/stock/local/${localId}/bajo`).then(r => r.data);

export const actualizarStockMinimo = (data: { productoId: number; localId: number; stockMinimo: number }) =>
  api.put('/stock/minimo', data).then(r => r.data);
