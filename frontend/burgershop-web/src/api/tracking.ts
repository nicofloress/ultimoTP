import api from './client';

export interface UbicacionRepartidor {
  repartidorId: number;
  repartidorNombre: string;
  latitud: number;
  longitud: number;
  fechaActualizacion: string;
  estaActivo: boolean;
}

export async function obtenerRepartidoresActivos(localId?: number): Promise<UbicacionRepartidor[]> {
  const { data } = await api.get<UbicacionRepartidor[]>('/tracking/activos', {
    params: localId ? { localId } : {},
  });
  return data;
}

export async function obtenerUbicacionRepartidor(id: number): Promise<UbicacionRepartidor> {
  const { data } = await api.get<UbicacionRepartidor>(`/tracking/repartidor/${id}`);
  return data;
}

export async function enviarUbicacion(latitud: number, longitud: number): Promise<void> {
  await api.post('/tracking/ubicacion', { latitud, longitud });
}

export async function desactivarTracking(): Promise<void> {
  await api.post('/tracking/desactivar');
}
