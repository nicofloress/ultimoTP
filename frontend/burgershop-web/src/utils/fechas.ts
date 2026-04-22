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
