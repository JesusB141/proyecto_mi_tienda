/** Redondea un valor monetario a 2 decimales evitando errores de coma flotante. */
export function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

const OFFSET_COLOMBIA_MS = -5 * 60 * 60 * 1000; // Colombia: UTC-5, sin horario de verano

/** Fecha y hora actual de Colombia como Date desplazada (usar solo métodos UTC). */
function ahoraColombia(ahora = new Date()) {
  return new Date(ahora.getTime() + OFFSET_COLOMBIA_MS);
}

/** Fecha de hoy en Colombia con formato YYYY-MM-DD. */
export function hoyColombia(ahora = new Date()) {
  return ahoraColombia(ahora).toISOString().slice(0, 10);
}

/** Fecha y hora actual de Colombia con formato YYYY-MM-DD HH:MM:SS (para MySQL). */
export function ahoraColombiaSQL(ahora = new Date()) {
  return ahoraColombia(ahora).toISOString().slice(0, 19).replace('T', ' ');
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** true si el texto es una fecha válida YYYY-MM-DD. */
export function esFechaValida(texto) {
  if (typeof texto !== 'string' || !FECHA_RE.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/** Suma días a una fecha YYYY-MM-DD. */
export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Diferencia en días (b - a) entre dos fechas YYYY-MM-DD. */
export function diferenciaDias(a, b) {
  const ms = new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Convierte un id recibido por la URL o el cuerpo en entero positivo, o null. */
export function aId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}
