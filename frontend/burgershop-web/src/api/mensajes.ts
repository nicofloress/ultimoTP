import api from './client';
import { Mensaje } from '../types';

export const getMensajesRepartidor = (repartidorId: number) =>
  api.get<Mensaje[]>(`/mensajes/repartidor/${repartidorId}`).then(r => r.data);

export const enviarMensajeAdmin = (repartidorId: number, texto: string) =>
  api.post<Mensaje>('/mensajes/admin', { repartidorId, texto }).then(r => r.data);

export const enviarMensajeRepartidor = (texto: string) =>
  api.post<Mensaje>('/mensajes/repartidor', { texto }).then(r => r.data);

export const marcarLeidos = (repartidorId: number, esDeAdmin: boolean) =>
  api.put(`/mensajes/leidos/${repartidorId}?esDeAdmin=${esDeAdmin}`);

export const getNoLeidos = (repartidorId: number, esDeAdmin: boolean) =>
  api.get<number>(`/mensajes/no-leidos/${repartidorId}?esDeAdmin=${esDeAdmin}`).then(r => r.data);
