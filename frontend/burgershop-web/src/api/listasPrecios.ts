import api from './client';
import { ListaPrecio, CrearListaPrecioDto, ActualizarListaPrecioDto, UpsertDetalleDto, ListaPrecioDetalle } from '../types';

export const getListasPrecios = () =>
  api.get<ListaPrecio[]>('/listasprecios').then(r => r.data);

export const getListaPrecio = (id: number) =>
  api.get<ListaPrecio>(`/listasprecios/${id}`).then(r => r.data);

export const crearListaPrecio = (data: CrearListaPrecioDto) =>
  api.post<ListaPrecio>('/listasprecios', data).then(r => r.data);

export const actualizarListaPrecio = (id: number, data: ActualizarListaPrecioDto) =>
  api.put<ListaPrecio>(`/listasprecios/${id}`, data).then(r => r.data);

export const eliminarListaPrecio = (id: number) =>
  api.delete(`/listasprecios/${id}`).then(r => r.data);

export const upsertDetalle = (listaPrecioId: number, data: UpsertDetalleDto) =>
  api.post<ListaPrecioDetalle>(`/listasprecios/${listaPrecioId}/detalles`, data).then(r => r.data);

export const eliminarDetalle = (listaPrecioId: number, productoId: number) =>
  api.delete(`/listasprecios/${listaPrecioId}/detalles/${productoId}`).then(r => r.data);
