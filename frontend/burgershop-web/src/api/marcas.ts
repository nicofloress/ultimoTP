import client from './client';

export interface MarcaDto {
  id: number;
  nombre: string;
  descripcion?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  activo: boolean;
}

export const getMarcas = () =>
  client.get<MarcaDto[]>('/marcas').then(r => r.data);

export const getMarcasActivas = () =>
  client.get<MarcaDto[]>('/marcas/activas').then(r => r.data);

export const crearMarca = (data: { nombre: string; descripcion?: string; proveedorId?: number }) =>
  client.post<MarcaDto>('/marcas', data).then(r => r.data);

export const actualizarMarca = (id: number, data: { nombre: string; descripcion?: string; proveedorId?: number; activo: boolean }) =>
  client.put<MarcaDto>(`/marcas/${id}`, data).then(r => r.data);

export const eliminarMarca = (id: number) =>
  client.delete(`/marcas/${id}`);
