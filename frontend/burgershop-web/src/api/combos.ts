import api from './client';
import { Combo } from '../types';

export const getCombos = () => api.get<Combo[]>('/combos').then(r => r.data);
export const getCombo = (id: number) => api.get<Combo>(`/combos/${id}`).then(r => r.data);

export const createCombo = (data: { nombre: string; descripcion?: string; precio: number; detalles: { productoId: number; cantidad: number }[] }) =>
  api.post<Combo>('/combos', data).then(r => r.data);

export const updateCombo = (id: number, data: { nombre: string; descripcion?: string; precio: number; activo: boolean; detalles: { productoId: number; cantidad: number }[] }) =>
  api.put<Combo>(`/combos/${id}`, data).then(r => r.data);

export const deleteCombo = (id: number) => api.delete(`/combos/${id}`);
