export interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  costoEnvio: number;
  activa: boolean;
}

export interface Repartidor {
  id: number;
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  activo: boolean;
  zonas: Zona[];
}

export interface CrearRepartidorDto {
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  codigoAcceso: string;
}

export interface ActualizarRepartidorDto {
  nombre: string;
  telefono?: string;
  vehiculo?: string;
  activo: boolean;
  codigoAcceso?: string;
}
