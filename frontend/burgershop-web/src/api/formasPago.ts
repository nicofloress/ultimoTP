import api from './client';
import { FormaPago, CreateFormaPago, UpdateFormaPago } from '../types';

export const getFormasPago = () =>
  api.get<FormaPago[]>('/formaspago').then(r => r.data);

export const getFormasPagoActivas = () =>
  api.get<FormaPago[]>('/formaspago/activas').then(r => r.data);

export const createFormaPago = (data: CreateFormaPago) =>
  api.post<FormaPago>('/formaspago', data).then(r => r.data);

export const updateFormaPago = (id: number, data: UpdateFormaPago) =>
  api.put<FormaPago>(`/formaspago/${id}`, data).then(r => r.data);

export const deleteFormaPago = (id: number) =>
  api.delete(`/formaspago/${id}`);
