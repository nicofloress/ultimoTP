import api from './client';

export interface PromocionItemDto {
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

export interface PromocionDto {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
  tipoDescuento: number; // 1=Porcentaje, 2=MontoFijo
  valorDescuento: number;
  activa: boolean;
  fechaCreacion: string;
  items: PromocionItemDto[];
  locales: PromocionLocalDto[];
}

export interface CrearPromocionItemDto {
  productoId?: number;
  comboId?: number;
  precioPromo?: number;
}

export interface CrearPromocionDto {
  nombre: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
  tipoDescuento: number;
  valorDescuento: number;
  items: CrearPromocionItemDto[];
  localIds: number[];
}

export interface ActualizarPromocionDto extends CrearPromocionDto {
  activa: boolean;
}

export const getPromociones = () => api.get<PromocionDto[]>('/promociones').then(r => r.data);
export const getPromocion = (id: number) => api.get<PromocionDto>(`/promociones/${id}`).then(r => r.data);
export const crearPromocion = (data: CrearPromocionDto) => api.post<PromocionDto>('/promociones', data).then(r => r.data);
export const actualizarPromocion = (id: number, data: ActualizarPromocionDto) => api.put<PromocionDto>(`/promociones/${id}`, data).then(r => r.data);
export const eliminarPromocion = (id: number) => api.delete(`/promociones/${id}`);
