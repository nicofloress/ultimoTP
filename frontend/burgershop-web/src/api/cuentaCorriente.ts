import api from './client';

export interface CuentaCorrienteDto {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono?: string;
  saldoActual: number;
  limiteCredito: number;
  activa: boolean;
  fechaApertura: string;
  fechaUltimoMovimiento: string;
}

export interface MovimientoCuentaCorrienteDto {
  id: number;
  cuentaCorrienteId: number;
  fechaMovimiento: string;
  fechaProceso: string;
  tipo: string;
  monto: number;
  saldoResultante: number;
  pedidoId?: number;
  numeroTicket?: string;
  ventaId?: number;
  numeroVenta?: string;
  movimientoId?: number;
  usuarioId?: number;
  usuarioNombre?: string;
  observaciones?: string;
}

export const getCuentasCorrientes = () =>
  api.get<CuentaCorrienteDto[]>('/cuenta-corriente').then(r => r.data);

export const getCuentasConSaldo = () =>
  api.get<CuentaCorrienteDto[]>('/cuenta-corriente/con-saldo').then(r => r.data);

export const getCuentaByCliente = (clienteId: number) =>
  api.get<CuentaCorrienteDto>(`/cuenta-corriente/cliente/${clienteId}`).then(r => r.data);

export const getMovimientosCuenta = (clienteId: number, desde?: string, hasta?: string) =>
  api.get<MovimientoCuentaCorrienteDto[]>(`/cuenta-corriente/cliente/${clienteId}/movimientos`, { params: { desde, hasta } }).then(r => r.data);

export const registrarCargo = (data: { clienteId: number; monto: number; pedidoId?: number; ventaId?: number; observaciones?: string }) =>
  api.post<MovimientoCuentaCorrienteDto>('/cuenta-corriente/cargo', data).then(r => r.data);

export const registrarPago = (data: { clienteId: number; monto: number; formaPagoId: number; localId: number; observaciones?: string }) =>
  api.post<MovimientoCuentaCorrienteDto>('/cuenta-corriente/pago', data).then(r => r.data);

export const registrarAjuste = (data: { clienteId: number; monto: number; esAFavor: boolean; observaciones: string }) =>
  api.post<MovimientoCuentaCorrienteDto>('/cuenta-corriente/ajuste', data).then(r => r.data);

export const actualizarLimiteCredito = (clienteId: number, limite: number) =>
  api.put(`/cuenta-corriente/cliente/${clienteId}/limite`, { limite }).then(r => r.data);
