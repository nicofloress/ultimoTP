import api from './client';

export interface HistorialPrecioDto {
  id: number;
  tipoEntidad: string;
  entidadId: number;
  nombreEntidad?: string;
  precioAnterior: number;
  precioNuevo: number;
  fechaCambio: string;
  usuarioNombre?: string;
}

export const getHistorialPrecios = (tipoEntidad: string, entidadId: number) =>
  api.get<HistorialPrecioDto[]>(`/historialprecios/${tipoEntidad}/${entidadId}`).then(r => r.data);

export const getHistorialRecientes = (cantidad = 50) =>
  api.get<HistorialPrecioDto[]>(`/historialprecios/recientes`, { params: { cantidad } }).then(r => r.data);
