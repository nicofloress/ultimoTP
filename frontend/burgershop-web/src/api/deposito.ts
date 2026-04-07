import api from './client';
import { Pedido } from '../types';

export const getPedidosDeposito = () =>
  api.get<Pedido[]>('/pedidos/deposito').then(r => r.data);
