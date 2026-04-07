/**
 * Parsea un atajo de combo como "30x80epmamo" y devuelve los criterios de búsqueda.
 * Formato: [cantidad]x[gramaje][línea][p?][aderezos?]
 * - cantidad: número
 * - gramaje: número (55, 69, 80, 100, 110, 120, 160, 198)
 * - línea: e = Económica, p = Premium
 * - p después de línea = con Pan
 * - ma = Mayonesa, mo = Mostaza, add = Aderezos genérico
 *
 * Ejemplos:
 * - "30x80pp" → 30 unidades, 80gr, Premium, con Pan
 * - "30x80ep" → 30 unidades, 80gr, Económica, con Pan
 * - "30x80epmamo" → 30 Eco con Pan + Mayonesa + Mostaza
 * - "30x80e" → 30 unidades, 80gr, Económica (sin pan)
 */

export interface AtajoCombo {
  cantidad: number;
  gramaje: number;
  linea: 'eco' | 'premium';
  conPan: boolean;
  aderezos: string[]; // nombres parciales de aderezos: "mayo", "most", etc.
}

export function parsearAtajo(input: string): AtajoCombo | null {
  const texto = input.trim().toLowerCase().replace(/\s/g, '');

  // Patrón: NUMxNUM[e|p][p?][aderezos?]
  const match = texto.match(/^(\d+)x(\d+)(e|p)(.*)$/);
  if (!match) return null;

  const cantidad = parseInt(match[1], 10);
  const gramaje = parseInt(match[2], 10);
  const lineaChar = match[3];
  let resto = match[4];

  const linea: 'eco' | 'premium' = lineaChar === 'e' ? 'eco' : 'premium';

  // Si empieza con 'p', tiene pan
  let conPan = false;
  if (resto.startsWith('p')) {
    conPan = true;
    resto = resto.substring(1);
  }

  // Parsear aderezos del resto
  const aderezos: string[] = [];
  let i = 0;
  while (i < resto.length) {
    if (resto.substring(i).startsWith('ma')) {
      aderezos.push('mayo');
      i += 2;
    } else if (resto.substring(i).startsWith('mo')) {
      aderezos.push('most');
      i += 2;
    } else if (resto.substring(i).startsWith('ke') || resto.substring(i).startsWith('k')) {
      aderezos.push('ketch');
      i += resto.substring(i).startsWith('ke') ? 2 : 1;
    } else if (resto.substring(i).startsWith('ch')) {
      aderezos.push('cheddar');
      i += 2;
    } else if (resto.substring(i).startsWith('add')) {
      aderezos.push('aderezo');
      i += 3;
    } else {
      i++; // carácter no reconocido, saltar
    }
  }

  return { cantidad, gramaje, linea, conPan, aderezos };
}

/**
 * Filtra combos que coincidan con un atajo parseado.
 * Busca en los detalles del combo si contiene los productos esperados.
 */
export function filtrarCombosPorAtajo<
  C extends { id: number; nombre: string; activo: boolean; detalles: { productoId: number; productoNombre: string; cantidad: number }[] },
>(
  combos: C[],
  atajo: AtajoCombo,
  productos: { id: number; nombre: string; pesoGramos?: number; categoriaId: number }[],
  categorias: { id: number; nombre: string }[]
): C[] {
  return combos.filter(c => {
    if (!c.activo) return false;

    // Buscar si el combo contiene la hamburguesa correcta (cantidad, gramaje, línea)
    const lineaTexto = atajo.linea === 'eco' ? 'conomica' : 'remium';
    const hambDetalle = c.detalles.find(d => {
      const prod = productos.find(p => p.id === d.productoId);
      if (!prod) return false;
      if (prod.pesoGramos !== atajo.gramaje) return false;
      if (d.cantidad !== atajo.cantidad) return false;
      // Verificar línea por nombre de categoría
      const cat = categorias.find(ct => ct.id === prod.categoriaId);
      if (!cat || !cat.nombre.toLowerCase().includes(lineaTexto)) return false;
      return true;
    });
    if (!hambDetalle) return false;

    // Si requiere pan, verificar que tenga pan
    if (atajo.conPan) {
      const tienePan = c.detalles.some(d => {
        const prod = productos.find(p => p.id === d.productoId);
        return prod?.nombre.toLowerCase().includes('pan ');
      });
      if (!tienePan) return false;
    }

    // Si requiere aderezos específicos, verificar cada uno
    for (const aderezo of atajo.aderezos) {
      if (aderezo === 'aderezo') {
        // Genérico: al menos un aderezo
        const tieneAderezo = c.detalles.some(d => {
          const prod = productos.find(p => p.id === d.productoId);
          const nombre = prod?.nombre.toLowerCase() || '';
          return nombre.includes('mayo') || nombre.includes('most') || nombre.includes('ketch') || nombre.includes('cheddar') || nombre.includes('parme') || nombre.includes('barbac');
        });
        if (!tieneAderezo) return false;
      } else {
        const tieneEste = c.detalles.some(d => {
          const prod = productos.find(p => p.id === d.productoId);
          return prod?.nombre.toLowerCase().includes(aderezo);
        });
        if (!tieneEste) return false;
      }
    }

    return true;
  });
}
