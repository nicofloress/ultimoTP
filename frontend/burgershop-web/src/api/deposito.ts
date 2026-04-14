import api from './client';
import type { Venta } from '../types';

export const getVentasDeposito = () =>
  api.get<Venta[]>('/ventas/deposito').then(r => r.data);

export const marcarVencidoDeposito = (id: number) =>
  api.put(`/ventas/${id}/vencer-deposito`);
