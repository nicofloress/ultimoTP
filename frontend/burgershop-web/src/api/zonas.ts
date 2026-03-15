import api from './client';
import { Zona } from '../types';

export const getZonas = () => api.get<Zona[]>('/zonas').then(r => r.data);
export const createZona = (data: { nombre: string; descripcion?: string; costoEnvio: number }) => api.post<Zona>('/zonas', data).then(r => r.data);
export const updateZona = (id: number, data: { nombre: string; descripcion?: string; costoEnvio: number; activa: boolean }) => api.put<Zona>(`/zonas/${id}`, data).then(r => r.data);
export const deleteZona = (id: number) => api.delete(`/zonas/${id}`);
