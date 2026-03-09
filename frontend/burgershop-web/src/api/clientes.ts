import api from './client';
import { ClienteDto, CrearClienteDto } from '../types';

export const buscarClientes = (term: string) =>
  api.get<ClienteDto[]>('/clientes', { params: { buscar: term } }).then(r => r.data);

export const getClientes = () =>
  api.get<ClienteDto[]>('/clientes').then(r => r.data);

export const crearCliente = (data: CrearClienteDto) =>
  api.post<ClienteDto>('/clientes', data).then(r => r.data);

export const actualizarCliente = (id: number, data: CrearClienteDto) =>
  api.put<ClienteDto>(`/clientes/${id}`, data).then(r => r.data);

export const eliminarCliente = (id: number) =>
  api.delete(`/clientes/${id}`).then(r => r.data);
