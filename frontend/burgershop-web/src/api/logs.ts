import api from './client';

export enum LogNivel {
  Info = 0,
  Warning = 1,
  Error = 2,
  Critical = 3
}

export interface LogEntry {
  id: number;
  fecha: string;
  nivel: LogNivel;
  origen: string;
  mensaje: string;
  stackTrace?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  rol?: string;
  localId?: number;
  localNombre?: string;
  httpMethod?: string;
  ruta?: string;
  statusCode?: number;
  ip?: string;
  duracionMs?: number;
  userAgent?: string;
}

export interface LogPagedResult {
  items: LogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getLogs = (params: {
  desde?: string;
  hasta?: string;
  nivel?: number;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}) => api.get<LogPagedResult>('/logs', { params }).then(r => r.data);

export const limpiarLogs = (dias: number = 30) =>
  api.delete<{ eliminados: number }>(`/logs/limpiar?dias=${dias}`).then(r => r.data);
