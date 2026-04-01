export enum RolUsuario {
  SuperAdmin = 0,
  Administrador = 1,
  Local = 2,
  Repartidor = 3
}

export interface Usuario {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: RolUsuario;
  rolNombre: string;
  repartidorId?: number;
  localId?: number;
}

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginResult {
  token: string;
  usuario: Usuario;
}
