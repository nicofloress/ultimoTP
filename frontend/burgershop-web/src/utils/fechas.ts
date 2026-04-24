/**
 * Parsea una fecha del backend (ISO o "YYYY-MM-DD") como Date local a las 00:00.
 * Evita el corrimiento de UTC que produce `new Date("YYYY-MM-DD")`.
 */
export function parseFechaLocal(fecha: string): Date {
  const soloFecha = fecha.includes('T') ? fecha.substring(0, 10) : fecha;
  return new Date(soloFecha + 'T00:00:00');
}

export function esDiaAnterior(fecha: string): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return parseFechaLocal(fecha).getTime() < hoy.getTime();
}

/**
 * Parsea una fecha ISO asumiendo UTC si no especifica zona horaria.
 * El backend guarda DateTime.UtcNow pero segun el mapping de Npgsql puede
 * serializarse sin el sufijo "Z", haciendo que el browser lo interprete
 * como hora local. Esta funcion agrega "Z" si falta para forzar UTC.
 */
export function parseFechaUtc(fecha: string): Date {
  // Si ya tiene Z o un offset (+03:00 / -0300), usar como esta
  const tieneZona = /Z$|[+-]\d{2}:?\d{2}$/i.test(fecha);
  return new Date(tieneZona ? fecha : fecha + 'Z');
}
