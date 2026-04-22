import api from './client';

export interface CodigoAccion {
  id: number;
  codigo: string;
  nombre: string;
  signo: number;
  tipoAfectacion: string;
  activo: boolean;
}

export interface MovimientoDto {
  id: number;
  fechaMovimiento: string;
  fechaProceso: string;
  codigoAccionId: number;
  codigoAccionCodigo: string;
  codigoAccionNombre: string;
  signo: number;
  productoId?: number;
  productoNombre?: string;
  localId: number;
  localNombre: string;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  ventaId?: number;
  numeroTicket?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  observaciones?: string;
  clienteNombre?: string;
}

export interface CrearMovimientoDto {
  codigoAccionId: number;
  productoId?: number;
  localId: number;
  cantidad: number;
  precioUnitario: number;
  fechaMovimiento: string;
  observaciones?: string;
}

export const getCodigosAccion = () =>
  api.get<CodigoAccion[]>('/movimientos/codigos-accion').then(r => r.data);

export const getMovimientosPorLocal = (localId: number, desde?: string, hasta?: string) =>
  api.get<MovimientoDto[]>(`/movimientos/local/${localId}`, { params: { desde, hasta } }).then(r => r.data);

export const getMovimientosPorProductoLocal = (productoId: number, localId: number, desde?: string, hasta?: string) =>
  api.get<MovimientoDto[]>(`/movimientos/producto/${productoId}/local/${localId}`, { params: { desde, hasta } }).then(r => r.data);

export const getMovimientosPorPedido = (pedidoId: number) =>
  api.get<MovimientoDto[]>(`/movimientos/pedido/${pedidoId}`).then(r => r.data);

export const crearMovimiento = (data: CrearMovimientoDto) =>
  api.post<MovimientoDto>('/movimientos', data).then(r => r.data);

export interface CrearDevolucionDto {
  productoId?: number;
  comboId?: number;
  localId: number;
  cantidad: number;
  precioUnitario: number;
  fechaMovimiento: string;
  motivo: string;
  clienteId?: number;
}

export const crearDevolucion = (data: CrearDevolucionDto) =>
  api.post<MovimientoDto>('/movimientos/devolucion', data).then(r => r.data);

export interface CrearCompraDto {
  productoId: number;
  localId: number;
  cantidadBultos: number;
  precioPorBulto: number;
  fechaMovimiento: string;
  observaciones?: string;
  impactarEnCaja: boolean;
}

export interface EditarCompraDto {
  cantidadBultos: number;
  precioPorBulto: number;
  fechaMovimiento: string;
  observaciones?: string;
  impactarEnCaja: boolean;
}

export const crearCompra = (data: CrearCompraDto) =>
  api.post<MovimientoDto>('/movimientos/compra', data).then(r => r.data);

export const editarCompra = (id: number, data: EditarCompraDto) =>
  api.put<MovimientoDto>(`/movimientos/compra/${id}`, data).then(r => r.data);

export const eliminarCompra = (id: number) =>
  api.delete(`/movimientos/compra/${id}`);

export interface CrearTransferenciaDto {
  productoId: number;
  localOrigenId: number;
  localDestinoId: number;
  cantidadBultos: number;
  observaciones?: string;
  cantidadUnidades?: number;
}

export const crearTransferencia = (data: CrearTransferenciaDto) =>
  api.post<MovimientoDto>('/movimientos/transferencia', data).then(r => r.data);
