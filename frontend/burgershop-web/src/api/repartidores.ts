import client from './client';
import { Repartidor, CrearRepartidorDto, ActualizarRepartidorDto } from '../types/logistica';

export const getRepartidores = () => client.get<Repartidor[]>('/repartidores');
export const getRepartidor = (id: number) => client.get<Repartidor>(`/repartidores/${id}`);
export const crearRepartidor = (data: CrearRepartidorDto) => client.post<Repartidor>('/repartidores', data);
export const actualizarRepartidor = (id: number, data: ActualizarRepartidorDto) => client.put<Repartidor>(`/repartidores/${id}`, data);
export const eliminarRepartidor = (id: number) => client.delete(`/repartidores/${id}`);
