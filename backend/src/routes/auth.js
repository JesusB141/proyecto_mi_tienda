import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool, enTransaccion } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { abrirSesion, cerrarSesion, requiereSesion } from '../middleware/sesion.js';
import { validarDiasAviso, validarLogin, validarRegistro } from '../domain/validaciones.js';
import { conflicto, ErrorNegocio } from '../domain/errores.js';

const router = Router();

// Limita intentos para frenar ataques de fuerza bruta contra las contraseñas.
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espere unos minutos e intente de nuevo' },
});

// HU-01 CA-1: crear cuenta
router.post('/registro', limitador, ruta(async (req, res) => {
  const { tienda, usuario, password } = validarRegistro(req.body);
  const [existe] = await pool.query('SELECT id FROM usuario WHERE usuario = ?', [usuario]);
  if (existe.length) throw conflicto('Ese usuario ya está en uso. Elija otro');

  const hash = await bcrypt.hash(password, 12);
  const ids = await enTransaccion(async (conn) => {
    const [t] = await conn.query('INSERT INTO tienda (nombre) VALUES (?)', [tienda]);
    const [u] = await conn.query(
      'INSERT INTO usuario (tienda_id, usuario, password_hash) VALUES (?, ?, ?)',
      [t.insertId, usuario, hash],
    );
    return { usuarioId: u.insertId, tiendaId: t.insertId };
  });
  abrirSesion(res, ids);
  res.status(201).json({ usuario, tienda });
}));

// HU-01 CA-2/CA-3: iniciar sesión
router.post('/login', limitador, ruta(async (req, res) => {
  const { usuario, password } = validarLogin(req.body);
  const [filas] = await pool.query(
    `SELECT u.id, u.tienda_id, u.password_hash, t.nombre AS tienda
       FROM usuario u JOIN tienda t ON t.id = u.tienda_id WHERE u.usuario = ?`,
    [usuario],
  );
  const u = filas[0];
  // Mismo mensaje si el usuario no existe o la contraseña falla (no revela qué usuarios existen).
  const ok = u ? await bcrypt.compare(password, u.password_hash) : false;
  if (!ok) throw new ErrorNegocio(401, 'Usuario o contraseña incorrectos. Revise e intente de nuevo');
  abrirSesion(res, { usuarioId: u.id, tiendaId: u.tienda_id });
  res.json({ usuario, tienda: u.tienda });
}));

router.post('/logout', (_req, res) => {
  cerrarSesion(res);
  res.json({ ok: true });
});

// HU-01 CA-4: recuperar la sesión abierta al volver a la aplicación
router.get('/yo', requiereSesion, ruta(async (req, res) => {
  const [filas] = await pool.query(
    `SELECT u.usuario, t.nombre AS tienda, t.dias_aviso_cobro
       FROM usuario u JOIN tienda t ON t.id = u.tienda_id WHERE u.id = ? AND t.id = ?`,
    [req.usuarioId, req.tiendaId],
  );
  if (!filas.length) throw new ErrorNegocio(401, 'Inicie sesión para continuar');
  res.json(filas[0]);
}));

// HU-07 CA-1: configurar días de aviso de cobro
router.put('/configuracion', requiereSesion, ruta(async (req, res) => {
  const dias = validarDiasAviso(req.body?.dias_aviso_cobro);
  await pool.query('UPDATE tienda SET dias_aviso_cobro = ? WHERE id = ?', [dias, req.tiendaId]);
  res.json({ dias_aviso_cobro: dias });
}));

export default router;
