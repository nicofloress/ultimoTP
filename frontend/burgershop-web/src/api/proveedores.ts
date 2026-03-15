import client from './client';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../types/catalogo';

export const getProveedores = () => client.get<Proveedor[]>('/proveedores').then(r => r.data);
export const getProveedor = (id: number) => client.get<Proveedor>(`/proveedores/${id}`).then(r => r.data);
export const crearProveedor = (data: CrearProveedorDto) => client.post<Proveedor>('/proveedores', data).then(r => r.data);
export const actualizarProveedor = (id: number, data: ActualizarProveedorDto) => client.put<Proveedor>(`/proveedores/${id}`, data).then(r => r.data);
export const eliminarProveedor = (id: number) => client.delete(`/proveedores/${id}`);
