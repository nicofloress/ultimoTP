export interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  costoEnvio: number;
  activa: boolean;
  localId?: number;
  localNombre?: string;
}

export interface Repartidor {
  id: number;
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  activo: boolean;
  zonas: Zona[];
  localId?: number;
  localNombre?: string;
  codigoAcceso: string;
}

export interface CrearRepartidorDto {
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  codigoAcceso?: string;
  localId?: number;
}

export interface ActualizarRepartidorDto {
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  activo: boolean;
  codigoAcceso?: string;
  localId?: number;
}

export interface Mensaje {
  id: number;
  repartidorId: number;
  texto: string;
  esDeAdmin: boolean;
  fechaEnvio: string;
  leido: boolean;
}
