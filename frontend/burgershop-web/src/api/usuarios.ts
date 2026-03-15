import client from './client';
import { RolUsuario } from '../types/auth';

export interface UsuarioList {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: RolUsuario;
  rolNombre: string;
  repartidorId?: number;
  repartidorNombre?: string;
  activo: boolean;
}

export interface CrearUsuarioDto {
  nombreUsuario: string;
  password: string;
  nombreCompleto: string;
  rol: RolUsuario;
  repartidorId?: number;
}

export interface ActualizarUsuarioDto {
  nombreUsuario: string;
  password?: string;
  nombreCompleto: string;
  rol: RolUsuario;
  repartidorId?: number;
  activo: boolean;
}

export const getUsuarios = () => client.get<UsuarioList[]>('/usuarios');
export const getUsuario = (id: number) => client.get<UsuarioList>(`/usuarios/${id}`);
export const crearUsuario = (data: CrearUsuarioDto) => client.post<UsuarioList>('/usuarios', data);
export const actualizarUsuario = (id: number, data: ActualizarUsuarioDto) => client.put<UsuarioList>(`/usuarios/${id}`, data);
export const eliminarUsuario = (id: number) => client.delete(`/usuarios/${id}`);
