import api from './client';
import { Producto } from '../types';

export const getProductos = (categoriaId?: number, buscar?: string) =>
  api.get<Producto[]>('/productos', { params: { ...(categoriaId ? { categoriaId } : {}), ...(buscar ? { buscar } : {}) } }).then(r => r.data);

export const getProducto = (id: number) => api.get<Producto>(`/productos/${id}`).then(r => r.data);

export const createProducto = (data: { nombre: string; descripcion?: string; precio: number; categoriaId: number; imagenUrl?: string; numeroInterno?: string }) =>
  api.post<Producto>('/productos', data).then(r => r.data);

export const updateProducto = (id: number, data: { nombre: string; descripcion?: string; precio: number; categoriaId: number; activo: boolean; imagenUrl?: string; numeroInterno?: string }) =>
  api.put<Producto>(`/productos/${id}`, data).then(r => r.data);

export const deleteProducto = (id: number) => api.delete(`/productos/${id}`);
