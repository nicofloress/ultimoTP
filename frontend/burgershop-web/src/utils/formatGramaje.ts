import { Producto } from '../types';

/**
 * Formatea un valor de pesoGramos como texto legible.
 * Detecta si algún producto con ese peso es líquido (unidadMedida = "ml")
 * para mostrar L/ml en vez de kg/gr.
 */
export function formatGramaje(g: number, productos: Producto[]): string {
  const prod = productos.find(p => p.pesoGramos === g);
  const esLiquido = prod?.unidadMedida === 'ml';

  if (esLiquido) {
    if (g >= 1000) return `${(g / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 })} L`;
    return `${g} ml`;
  }

  if (g >= 1000) return `${(g / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg`;
  return `${g} gr`;
}
