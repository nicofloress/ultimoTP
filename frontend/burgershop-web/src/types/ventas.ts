export interface LineaPedido {
  id: number;
  productoId?: number;
  comboId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export interface Pedido {
  id: number;
  numeroTicket: string;
  fechaCreacion: string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  nombreCliente?: string;
  telefonoCliente?: string;
  direccionEntrega?: string;
  zonaId?: number;
  zonaNombre?: string;
  subtotal: number;
  descuento: number;
  total: number;
  repartidorId?: number;
  repartidorNombre?: string;
  fechaAsignacion?: string;
  fechaEntrega?: string;
  notasEntrega?: string;
  lineas: LineaPedido[];
}

export enum TipoPedido {
  ParaLlevar = 1,
  Domicilio = 2,
}

export enum EstadoPedido {
  Pendiente = 1,
  EnPreparacion = 2,
  Listo = 3,
  Asignado = 4,
  EnCamino = 5,
  Entregado = 6,
  Cancelado = 7,
}

export interface CarritoItem {
  productoId?: number;
  comboId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
}
