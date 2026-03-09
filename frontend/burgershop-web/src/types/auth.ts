export enum RolUsuario {
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
}

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginResult {
  token: string;
  usuario: Usuario;
}
