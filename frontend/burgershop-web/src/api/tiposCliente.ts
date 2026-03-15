import client from './client';
import { TipoCliente, CrearTipoClienteDto, ActualizarTipoClienteDto } from '../types/ventas';

export const getTiposCliente = () => client.get<TipoCliente[]>('/tiposCliente').then(r => r.data);
export const getTipoCliente = (id: number) => client.get<TipoCliente>(`/tiposCliente/${id}`).then(r => r.data);
export const crearTipoCliente = (data: CrearTipoClienteDto) => client.post<TipoCliente>('/tiposCliente', data).then(r => r.data);
export const actualizarTipoCliente = (id: number, data: ActualizarTipoClienteDto) => client.put<TipoCliente>(`/tiposCliente/${id}`, data).then(r => r.data);
export const eliminarTipoCliente = (id: number) => client.delete(`/tiposCliente/${id}`);
