/**
 * Comparador genérico para ordenar tablas por una columna dinámica.
 * Maneja strings, números y null/undefined.
 */
export function compareBy<T>(a: T, b: T, col: string, dir: 'asc' | 'desc' = 'asc'): number {
  const valA = (a as unknown as Record<string, unknown>)[col];
  const valB = (b as unknown as Record<string, unknown>)[col];
  let cmp = 0;
  if (typeof valA === 'string' && typeof valB === 'string') cmp = valA.localeCompare(valB);
  else if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
  else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
  return dir === 'asc' ? cmp : -cmp;
}

/**
 * Hook helper: toggle de orden (si es la misma col, alterna dir; si es otra, resetea a asc).
 */
export function toggleOrdenCol(
  actual: string,
  nueva: string,
  dirActual: 'asc' | 'desc'
): { col: string; dir: 'asc' | 'desc' } {
  if (actual === nueva) return { col: actual, dir: dirActual === 'asc' ? 'desc' : 'asc' };
  return { col: nueva, dir: 'asc' };
}
