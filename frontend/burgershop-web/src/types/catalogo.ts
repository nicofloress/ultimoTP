export enum TipoMegaCategoria {
  Otro = 0,
  Hamburguesa = 1,
  Salchicha = 2,
  Pan = 3,
  Aderezo = 4,
  Snack = 5,
}

export interface Categoria {
  id: number;
  nombre: string;
  activa: boolean;
  categoriaPadreId?: number;
  categoriaPadreNombre?: string;
  tipoMegaCategoria: number;
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
  pesoGramos?: number;
  unidadMedida?: string; // "g" | "ml"
  unidadesPorBulto: number;
  precioLista?: number;
  marca?: string;
  unidadesPorMedia: number;
  unidadMinima: number;
  esOfertaSemanal?: boolean;
  precioCosto?: number;
  precioVenta?: number;
  fechaUltimaModificacionPrecio?: string;
  diferenciaPrecioCosto?: number;
  alicuotaIVA: number;
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
  esOfertaSemanal?: boolean;
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
  productoId?: number;
  productoNombre?: string;
  comboId?: number;
  comboNombre?: string;
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
  productoId?: number;
  comboId?: number;
  precio: number;
}
