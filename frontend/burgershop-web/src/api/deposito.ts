import api from './client';
import type { VentaDto } from './ventas';

export const getVentasDeposito = () =>
  api.get<VentaDto[]>('/ventas/deposito').then(r => r.data);
