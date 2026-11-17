import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ErrorNegocio } from '../domain/errores.js';

export const COOKIE_SESION = 'sesion';
const DURACION_DIAS = 30; // HU-01 CA-4: la sesión sigue abierta hasta que el tendero la cierre

const opcionesCookie = () => ({
  httpOnly: true, // JavaScript del navegador no puede leer el token (protege contra XSS)
  sameSite: 'strict', // el navegador no envía la cookie desde otros sitios (protege contra CSRF)
  secure: config.produccion, // solo por HTTPS en producción
  path: '/',
});

export function abrirSesion(res, { usuarioId, tiendaId }) {
  const token = jwt.sign({ uid: usuarioId, tid: tiendaId }, config.jwtSecret, {
    expiresIn: `${DURACION_DIAS}d`,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE_SESION, token, { ...opcionesCookie(), maxAge: DURACION_DIAS * 86_400_000 });
}

export function cerrarSesion(res) {
  res.clearCookie(COOKIE_SESION, opcionesCookie());
}

/** Exige sesión válida y deja req.usuarioId y req.tiendaId disponibles. */
export function requiereSesion(req, _res, next) {
  const token = req.cookies?.[COOKIE_SESION];
  if (!token) return next(new ErrorNegocio(401, 'Inicie sesión para continuar'));
  try {
    const datos = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.usuarioId = datos.uid;
    req.tiendaId = datos.tid;
    return next();
  } catch {
    return next(new ErrorNegocio(401, 'Su sesión terminó. Inicie sesión de nuevo'));
  }
}
