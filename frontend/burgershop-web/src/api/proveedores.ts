import client from './client';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../types/catalogo';

export const getProveedores = () => client.get<Proveedor[]>('/proveedores');
export const getProveedor = (id: number) => client.get<Proveedor>(`/proveedores/${id}`);
export const crearProveedor = (data: CrearProveedorDto) => client.post<Proveedor>('/proveedores', data);
export const actualizarProveedor = (id: number, data: ActualizarProveedorDto) => client.put<Proveedor>(`/proveedores/${id}`, data);
export const eliminarProveedor = (id: number) => client.delete(`/proveedores/${id}`);
