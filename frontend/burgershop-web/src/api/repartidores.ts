import client from './client';
import { Repartidor, CrearRepartidorDto, ActualizarRepartidorDto } from '../types/logistica';

export const getRepartidores = () => client.get<Repartidor[]>('/repartidores').then(r => r.data);
export const getRepartidor = (id: number) => client.get<Repartidor>(`/repartidores/${id}`).then(r => r.data);
export const crearRepartidor = (data: CrearRepartidorDto) => client.post<Repartidor>('/repartidores', data).then(r => r.data);
export const actualizarRepartidor = (id: number, data: ActualizarRepartidorDto) => client.put<Repartidor>(`/repartidores/${id}`, data).then(r => r.data);
export const eliminarRepartidor = (id: number) => client.delete(`/repartidores/${id}`);
export const asignarZonas = (id: number, zonaIds: number[]) => client.put<Repartidor>(`/repartidores/${id}/zonas`, { zonaIds }).then(r => r.data);
