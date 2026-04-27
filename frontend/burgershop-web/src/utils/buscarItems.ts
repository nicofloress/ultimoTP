import { parsearAtajo, filtrarCombosPorAtajo } from './atajoCombo';

/**
 * Búsqueda rápida de productos y combos para POS y alta de pedidos.
 *
 * - Quita acentos, lowercasea y colapsa "30 x 80" → "30x80".
 * - Trata "80g", "80gr", "80grs", "80gramos" como "80".
 * - Tokeniza por espacios: TODOS los tokens deben aparecer (orden libre).
 * - Para combos, además del nombre indexa los nombres de productos en sus detalles.
 */

export function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d)\s*x\s*(\d)/g, '$1x$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizarConsulta(s: string): string {
  return normalizarTexto(s)
    .replace(/(\d+)\s*(grs|gramos|gramo|gr|g)\b/g, '$1');
}

export function tokenizar(q: string): string[] {
  return normalizarConsulta(q).split(/\s+/).filter(Boolean);
}

export function coincide(haystack: string, tokens: string[]): boolean {
  for (let i = 0; i < tokens.length; i++) {
    if (!haystack.includes(tokens[i])) return false;
  }
  return true;
}

interface ProductoIndexable {
  id: number;
  nombre: string;
  codigo?: string;
  marca?: string;
  pesoGramos?: number;
  unidadMedida?: string;
}

interface ComboIndexable {
  id: number;
  codigo?: string;
  nombre: string;
  detalles: { productoNombre: string }[];
}

export function indexarProducto(p: ProductoIndexable): string {
  const partes: string[] = [p.nombre];
  if (p.codigo) partes.push(p.codigo);
  if (p.marca) partes.push(p.marca);
  if (p.pesoGramos) partes.push(`${p.pesoGramos}`);
  return normalizarTexto(partes.join(' '));
}

export function indexarCombo(c: ComboIndexable): string {
  const partes: string[] = [c.nombre];
  if (c.codigo) partes.push(c.codigo);
  for (const d of c.detalles) partes.push(d.productoNombre);
  return normalizarTexto(partes.join(' '));
}

export function construirIndiceProductos<P extends ProductoIndexable>(productos: P[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const p of productos) m.set(p.id, indexarProducto(p));
  return m;
}

export function construirIndiceCombos<C extends ComboIndexable>(combos: C[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const c of combos) m.set(c.id, indexarCombo(c));
  return m;
}

interface ProductoConCodigo extends ProductoIndexable { codigo?: string; activo: boolean }

export function buscarProductos<P extends ProductoConCodigo>(
  productos: P[],
  indice: Map<number, string>,
  query: string,
): P[] {
  if (!query.trim()) return [];

  // Prefix-match por codigo si la query es alfanumérica corta sin espacios (ej: "HAM-001", "30x")
  const queryNorm = normalizarTexto(query);
  if (!queryNorm.includes(' ')) {
    const porCodigo = productos.filter(p => p.activo && p.codigo && normalizarTexto(p.codigo).startsWith(queryNorm));
    if (porCodigo.length > 0) return porCodigo;
  }

  const tokens = tokenizar(query);
  if (tokens.length === 0) return [];
  const out: P[] = [];
  for (const p of productos) {
    if (!p.activo) continue;
    const hay = indice.get(p.id);
    if (hay && coincide(hay, tokens)) out.push(p);
  }
  return out;
}

export function buscarCombos<
  C extends ComboIndexable & {
    activo: boolean;
    detalles: { productoId: number; productoNombre: string; cantidad: number }[];
  },
>(
  combos: C[],
  productos: { id: number; nombre: string; pesoGramos?: number; categoriaId: number; unidadMinima: number }[],
  categorias: { id: number; nombre: string }[],
  indice: Map<number, string>,
  query: string,
): C[] {
  if (!query.trim()) return [];

  // 1) Prefix-match por código si la query tiene pinta de código (empieza con dígito)
  const queryNorm = normalizarTexto(query);
  if (/^\d/.test(queryNorm)) {
    const prefijo = queryNorm.replace(/\s/g, '');
    const porCodigo = combos.filter(c => c.activo && c.codigo && normalizarTexto(c.codigo).startsWith(prefijo));
    if (porCodigo.length > 0) return porCodigo;
  }

  // 2) Atajo estructurado (mismo trigger digit+x, ej "30x80pp")
  const atajo = parsearAtajo(query);
  if (atajo) {
    const porAtajo = filtrarCombosPorAtajo(combos, atajo, productos, categorias);
    if (porAtajo.length > 0) return porAtajo;
  }

  // 3) Búsqueda tokenizada por nombre/código/detalles
  const tokens = tokenizar(query);
  if (tokens.length === 0) return [];
  const out: C[] = [];
  for (const c of combos) {
    if (!c.activo) continue;
    const hay = indice.get(c.id);
    if (hay && coincide(hay, tokens)) out.push(c);
  }
  return out;
}
