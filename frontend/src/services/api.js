/** Error de la API con el mensaje para el usuario y los errores por campo. */
export class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles || {};
  }
}

let alExpirarSesion = () => {};
export const onSesionExpirada = (fn) => { alExpirarSesion = fn; };

async function pedir(metodo, ruta, cuerpo) {
  let res;
  try {
    res = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin', // la sesión viaja en una cookie httpOnly
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión a Internet. Revisa tu conexión e intenta de nuevo');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !ruta.startsWith('/auth/')) alExpirarSesion();
    throw new ErrorApi(res.status, datos.error || 'Ocurrió un error. Intenta de nuevo', datos.detalles);
  }
  return datos;
}

export const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo ?? {}),
  put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
  del: (ruta) => pedir('DELETE', ruta),
};

const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const pesos = (v) => formatoPesos.format(Number(v) || 0);

/** Fecha de hoy en Colombia (YYYY-MM-DD). */
export const hoy = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });
/** "2026-11-17 14:05:00" → "17 nov 2026, 2:05 p. m." */
export function fechaHora(texto) {
  if (!texto) return '';
  const [f, h] = texto.split(' ');
  const d = new Date(`${f}T${h || '00:00:00'}`);
  return h ? `${formatoFecha.format(d)}, ${formatoHora.format(d)}` : formatoFecha.format(d);
}
export const soloFecha = (texto) => (texto ? formatoFecha.format(new Date(`${texto.slice(0, 10)}T00:00:00`)) : '');
