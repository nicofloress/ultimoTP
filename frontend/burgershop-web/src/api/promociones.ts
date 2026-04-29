import api from './client';

export enum TipoBeneficio {
  PorcentajeDescuento = 1,
  MontoFijoDescuento = 2,
  PrecioFijoItems = 3,
  ReintegroPorcentaje = 4,
  ReintegroMonto = 5,
}

export enum TipoCondicion {
  DiaSemana = 1,
  FormaPago = 2,
  MontoMinimo = 3,
  Horario = 4,
  TipoCliente = 6,
  Cupon = 8,
  CantidadMinima = 9,
}

export interface PromocionItemDto {
  id?: number;
  productoId?: number;
  productoNombre?: string;
  comboId?: number;
  comboNombre?: string;
  precioPromo?: number;
}

export interface PromocionLocalDto {
  localId: number;
  localNombre: string;
}

export interface PromocionCondicionDto {
  id?: number;
  tipo: TipoCondicion;
  valor: string;
}

export interface PromocionDto {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
  tipoBeneficio: TipoBeneficio;
  valorBeneficio: number;
  topeMaximo?: number;
  acumulable: boolean;
  prioridad: number;
  activa: boolean;
  fechaCreacion: string;
  items: PromocionItemDto[];
  locales: PromocionLocalDto[];
  tiposVenta: number[];
  condiciones: PromocionCondicionDto[];
}

export interface CrearPromocionItemDto {
  productoId?: number;
  comboId?: number;
  precioPromo?: number;
}

export interface CrearPromocionCondicionDto {
  tipo: TipoCondicion;
  valor: string;
}

export interface CrearPromocionDto {
  nombre: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
  tipoBeneficio: TipoBeneficio;
  valorBeneficio: number;
  items: CrearPromocionItemDto[];
  localIds: number[];
  tiposVenta?: number[];
  condiciones?: CrearPromocionCondicionDto[];
  topeMaximo?: number;
  acumulable?: boolean;
  prioridad?: number;
}

export interface ActualizarPromocionDto extends CrearPromocionDto {
  activa: boolean;
}

export interface EvaluarPromocionItemDto {
  productoId?: number;
  comboId?: number;
  cantidad: number;
  precioUnitario: number;
}

export interface EvaluarPromocionesContextDto {
  localId: number;
  formaPagoId?: number;
  tipoVenta: number;
  fecha?: string;
  clienteId?: number;
  items: EvaluarPromocionItemDto[];
}

export interface PromocionAplicadaDto {
  promocionId: number;
  nombre: string;
  tipoBeneficio: TipoBeneficio;
  montoDescuento: number;
  montoReintegro?: number;
  esReintegro: boolean;
}

export interface EvaluarPromocionesResultDto {
  subtotalOriginal: number;
  totalDescuento: number;
  totalReintegro: number;
  totalFinal: number;
  promociones: PromocionAplicadaDto[];
}

export const getPromociones = () => api.get<PromocionDto[]>('/promociones').then(r => r.data);
export const getPromocionesVigentes = (localId: number) => api.get<PromocionDto[]>('/promociones/vigentes', { params: { localId } }).then(r => r.data);
export const getPromocion = (id: number) => api.get<PromocionDto>(`/promociones/${id}`).then(r => r.data);
export const crearPromocion = (data: CrearPromocionDto) => api.post<PromocionDto>('/promociones', data).then(r => r.data);
export const actualizarPromocion = (id: number, data: ActualizarPromocionDto) => api.put<PromocionDto>(`/promociones/${id}`, data).then(r => r.data);
export const desactivarPromocion = (id: number) => api.put(`/promociones/${id}/desactivar`);
export const eliminarPromocion = (id: number) => api.delete(`/promociones/${id}`);
export const evaluarPromociones = (ctx: EvaluarPromocionesContextDto) =>
  api.post<EvaluarPromocionesResultDto>('/promociones/evaluar', ctx).then(r => r.data);
