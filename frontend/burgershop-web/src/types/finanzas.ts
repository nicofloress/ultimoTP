export enum EstadoCaja {
  Abierta = 1,
  PendienteRevision = 2,
  Cerrada = 3,
}

export enum ResultadoRevision {
  SinDiferencia = 1,
  DiferenciaLeve = 2,
  DiferenciaGrave = 3,
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
  localId?: number;
  localNombre?: string;
  detalles: CierreCajaDetalle[];
  cantidadTotal: number;
  totalGeneral: number;
  cantidadMostrador: number;
  totalMostrador: number;
  cantidadDomicilio: number;
  totalDomicilio: number;
  cantidadCtaCte: number;
  totalCtaCte: number;
  totalNeto?: number;
  totalIVA?: number;
  montoEfectivoReal?: number;
  diferenciaCaja?: number;
  resultadoRevision?: ResultadoRevision;
  observacionRevision?: string;
  revisadoPorUsuarioId?: number;
  fechaRevision?: string;
  fechaUltimaModificacion?: string;
  usuarioUltimaModificacionId?: number;
}

export interface AbrirCajaDto {
  montoInicial: number;
  observaciones?: string;
  localId?: number;
}

export interface CerrarCajaDto {
  montoEfectivoReal: number;
  observaciones?: string;
}
