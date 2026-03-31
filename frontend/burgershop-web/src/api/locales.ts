import api from './client';

export interface LocalDto {
  id: number;
  nombre: string;
  direccion?: string;
  empresaId?: number;
  empresaNombre?: string;
  esPuntoVenta: boolean;
  activo: boolean;
}

export const getLocales = () => api.get<LocalDto[]>('/locales').then(r => r.data);
export const getLocal = (id: number) => api.get<LocalDto>(`/locales/${id}`).then(r => r.data);
export const crearLocal = (data: { nombre: string; direccion?: string; empresaId?: number; esPuntoVenta: boolean }) => api.post<LocalDto>('/locales', data).then(r => r.data);
export const actualizarLocal = (id: number, data: { nombre: string; direccion?: string; empresaId?: number; esPuntoVenta: boolean; activo: boolean }) => api.put<LocalDto>(`/locales/${id}`, data).then(r => r.data);
export const eliminarLocal = (id: number) => api.delete(`/locales/${id}`);
