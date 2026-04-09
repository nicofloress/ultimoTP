import api from './client';
import type { Venta } from '../types';

export const getVentasDeposito = () =>
  api.get<Venta[]>('/pedidos/deposito').then(r => r.data);
