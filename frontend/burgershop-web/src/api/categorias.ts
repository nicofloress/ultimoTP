import api from './client';
import { Categoria } from '../types';

export const getCategorias = () => api.get<Categoria[]>('/categorias').then(r => r.data);
export const createCategoria = (data: { nombre: string; categoriaPadreId?: number | null }) => api.post<Categoria>('/categorias', data).then(r => r.data);
export const updateCategoria = (id: number, data: { nombre: string; activa: boolean; categoriaPadreId?: number | null }) => api.put<Categoria>(`/categorias/${id}`, data).then(r => r.data);
export const deleteCategoria = (id: number) => api.delete(`/categorias/${id}`);
