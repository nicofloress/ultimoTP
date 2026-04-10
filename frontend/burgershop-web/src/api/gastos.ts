import api from './client';

export interface GastoDto {
  id: number;
  nombre: string;
  fechaGasto: string;
  fechaVencimiento?: string;
  categoria?: string;
  proveedor?: string;
  etiqueta?: string;
  formaPagoId?: number;
  formaPagoNombre?: string;
  subtotal: number;
  iva: number;
  total: number;
  deuda: number;
  pagado: boolean;
  observaciones?: string;
  localId?: number;
  localNombre?: string;
  activo: boolean;
}

export interface GastoStatsDto {
  cantidadGastos: number;
  gastosPagados: number;
  gastosAdeudados: number;
  gastosTotal: number;
}

export interface CrearGastoDto {
  nombre: string;
  fechaGasto: string;
  fechaVencimiento?: string;
  categoria?: string;
  proveedor?: string;
  etiqueta?: string;
  formaPagoId?: number;
  subtotal: number;
  iva?: number;
  total: number;
  deuda?: number;
  pagado?: boolean;
  observaciones?: string;
  localId?: number;
}

export const getGastos = (localId?: number) =>
  api.get<GastoDto[]>('/gastos', { params: localId ? { localId } : {} }).then(r => r.data);

export const getGastoStats = (localId?: number) =>
  api.get<GastoStatsDto>('/gastos/stats', { params: localId ? { localId } : {} }).then(r => r.data);

export const crearGasto = (data: CrearGastoDto) =>
  api.post<GastoDto>('/gastos', data).then(r => r.data);

export const actualizarGasto = (id: number, data: CrearGastoDto) =>
  api.put<GastoDto>(`/gastos/${id}`, data).then(r => r.data);

export const eliminarGasto = (id: number) =>
  api.delete(`/gastos/${id}`);
