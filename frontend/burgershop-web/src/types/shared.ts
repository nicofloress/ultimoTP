import { EstadoPedido } from './ventas';

export const estadoLabels: Record<EstadoPedido, string> = {
  [EstadoPedido.Pendiente]: 'Pendiente',
  [EstadoPedido.EnPreparacion]: 'En Preparación',
  [EstadoPedido.Listo]: 'Listo',
  [EstadoPedido.Asignado]: 'Asignado',
  [EstadoPedido.EnCamino]: 'En Camino',
  [EstadoPedido.Entregado]: 'Entregado',
  [EstadoPedido.Cancelado]: 'Cancelado',
  [EstadoPedido.NoEntregado]: 'No Entregado',
};

export const estadoColores: Record<EstadoPedido, string> = {
  [EstadoPedido.Pendiente]: 'bg-yellow-100 text-yellow-800',
  [EstadoPedido.EnPreparacion]: 'bg-blue-100 text-blue-800',
  [EstadoPedido.Listo]: 'bg-green-100 text-green-800',
  [EstadoPedido.Asignado]: 'bg-purple-100 text-purple-800',
  [EstadoPedido.EnCamino]: 'bg-orange-100 text-orange-800',
  [EstadoPedido.Entregado]: 'bg-gray-100 text-gray-800',
  [EstadoPedido.Cancelado]: 'bg-red-100 text-red-800',
  [EstadoPedido.NoEntregado]: 'bg-rose-100 text-rose-800',
};
