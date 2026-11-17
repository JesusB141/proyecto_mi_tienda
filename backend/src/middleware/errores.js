import { ErrorNegocio } from '../domain/errores.js';

/** Envuelve un manejador async para que Express reciba sus errores. */
export const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, _req, res, _next) {
  if (err instanceof ErrorNegocio) {
    return res.status(err.status).json({ error: err.message, detalles: err.detalles });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Los datos enviados no son válidos' });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ese registro ya existe' });
  }
  // Error inesperado: se registra en el servidor sin exponer detalles internos al usuario.
  console.error(err);
  return res.status(500).json({ error: 'Ocurrió un error inesperado. Intente de nuevo' });
}
