export interface Categoria {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  categoriaNombre: string;
  activo: boolean;
  imagenUrl?: string;
  numeroInterno?: string;
}

export interface ComboDetalle {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioProducto: number;
}

export interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  detalles: ComboDetalle[];
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
}

export interface CrearProveedorDto {
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
}

export interface ActualizarProveedorDto {
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
}

export interface ListaPrecio {
  id: number;
  nombre: string;
  esDefault: boolean;
  activa: boolean;
  detalles: ListaPrecioDetalle[];
}

export interface ListaPrecioDetalle {
  id: number;
  productoId: number;
  productoNombre: string;
  precio: number;
}

export interface CrearListaPrecioDto {
  nombre: string;
  esDefault: boolean;
}

export interface ActualizarListaPrecioDto {
  nombre: string;
  esDefault: boolean;
  activa: boolean;
}

export interface UpsertDetalleDto {
  productoId: number;
  precio: number;
}
