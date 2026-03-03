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
