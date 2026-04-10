export enum EstadoCaja {
  Abierta = 1,
  Cerrada = 2,
}

export interface CierreCajaDetalle {
  id: number;
  formaPagoId: number;
  formaPagoNombre: string;
  montoTotal: number;
  cantidadOperaciones: number;
}

export interface CierreCaja {
  id: number;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  montoFinal?: number;
  estado: EstadoCaja;
  observaciones?: string;
  usuarioId?: number;
  detalles: CierreCajaDetalle[];
  cantidadTotal: number;
  totalGeneral: number;
  cantidadMostrador: number;
  totalMostrador: number;
  cantidadDomicilio: number;
  totalDomicilio: number;
  cantidadCtaCte: number;
  totalCtaCte: number;
}

export interface AbrirCajaDto {
  montoInicial: number;
  observaciones?: string;
}

export interface CerrarCajaDto {
  observaciones?: string;
}
