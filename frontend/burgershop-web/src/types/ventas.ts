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
  fechaProgramada?: string;
  esProgramado?: boolean;
  notasEntrega?: string;
  formaPagoId?: number;
  formaPagoNombre?: string;
  recargo: number;
  notaInterna?: string;
  tipoFactura: TipoFactura;
  estaPago: boolean;
  comprobanteEntrega?: string;
  clienteId?: number;
  lineas: LineaPedido[];
  pagos?: PagoPedidoDto[];
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

export interface FormaPago {
  id: number;
  nombre: string;
  porcentajeRecargo: number;
  activa: boolean;
}

export interface CreateFormaPago {
  nombre: string;
  porcentajeRecargo: number;
  activa: boolean;
}

export interface UpdateFormaPago {
  nombre: string;
  porcentajeRecargo: number;
  activa: boolean;
}

export interface TipoCliente {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CrearTipoClienteDto {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarTipoClienteDto {
  nombre: string;
  descripcion?: string;
}

export enum TipoFactura {
  FacturaA = 1,
  FacturaB = 2,
  FacturaC = 3,
}

export interface ClienteDto {
  id: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  zonaId?: number;
  zonaNombre?: string;
  tipoClienteId?: number;
  tipoClienteNombre?: string;
  listaPrecioId?: number;
}

export interface PagoPedidoDto {
  id: number;
  formaPagoId: number;
  formaPagoNombre: string;
  monto: number;
  porcentajeRecargo: number;
  recargo: number;
  totalACobrar: number;
}

export interface CrearPagoDto {
  formaPagoId: number;
  monto: number;
}

export interface CrearClienteDto {
  nombre: string;
  telefono?: string;
  direccion?: string;
  zonaId?: number;
  tipoClienteId?: number;
}
