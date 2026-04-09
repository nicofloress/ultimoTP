import { EstadoVenta } from './ventas';

export const estadoLabels: Record<EstadoVenta, string> = {
  [EstadoVenta.Pendiente]: 'Pendiente',
  [EstadoVenta.EnPreparacion]: 'En Preparación',
  [EstadoVenta.Listo]: 'Listo',
  [EstadoVenta.Asignado]: 'Asignado',
  [EstadoVenta.EnCamino]: 'En Camino',
  [EstadoVenta.Entregado]: 'Entregado',
  [EstadoVenta.Cancelado]: 'Cancelado',
  [EstadoVenta.NoEntregado]: 'No Entregado',
};

export const estadoColores: Record<EstadoVenta, string> = {
  [EstadoVenta.Pendiente]: 'bg-yellow-100 text-yellow-800',
  [EstadoVenta.EnPreparacion]: 'bg-blue-100 text-blue-800',
  [EstadoVenta.Listo]: 'bg-green-100 text-green-800',
  [EstadoVenta.Asignado]: 'bg-purple-100 text-purple-800',
  [EstadoVenta.EnCamino]: 'bg-orange-100 text-orange-800',
  [EstadoVenta.Entregado]: 'bg-green-100 text-green-700',
  [EstadoVenta.Cancelado]: 'bg-red-100 text-red-800',
  [EstadoVenta.NoEntregado]: 'bg-rose-100 text-rose-800',
};
