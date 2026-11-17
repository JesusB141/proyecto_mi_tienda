import { Router } from 'express';
import { pool } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { validarMovimientoCaja } from '../domain/validaciones.js';
import { resumenFinanciero } from '../domain/reportes.js';
import { noValido } from '../domain/errores.js';
import { ahoraColombiaSQL, esFechaValida, hoyColombia, sumarDias } from '../domain/utilidades.js';

const router = Router();

// HU-05 CA-3: movimientos y saldo del día
router.get('/', ruta(async (req, res) => {
  const fecha = req.query.fecha || hoyColombia();
  if (!esFechaValida(fecha)) throw noValido('Fecha no válida');
  const [movimientos] = await pool.query(
    `SELECT id, tipo, concepto, valor, origen, fecha FROM movimiento_caja
      WHERE tienda_id = ? AND fecha >= ? AND fecha < ?
      ORDER BY fecha DESC, id DESC`,
    [req.tiendaId, fecha, sumarDias(fecha, 1)],
  );
  const { ingresos, egresos, utilidad } = resumenFinanciero(movimientos);
  res.json({ fecha, ingresos, egresos, saldo: utilidad, movimientos });
}));

// HU-05 CA-1: registrar ingreso o gasto manual
router.post('/', ruta(async (req, res) => {
  const m = validarMovimientoCaja(req.body);
  const hoy = hoyColombia();
  if (m.fecha > hoy) throw noValido('No se pueden registrar movimientos en fechas futuras');
  // Si es de hoy se guarda con la hora actual; si es de otro día, al mediodía de ese día.
  const fecha = m.fecha === hoy ? ahoraColombiaSQL() : `${m.fecha} 12:00:00`;
  const [r] = await pool.query(
    `INSERT INTO movimiento_caja (tienda_id, tipo, concepto, valor, origen, fecha)
     VALUES (?, ?, ?, ?, 'MANUAL', ?)`,
    [req.tiendaId, m.tipo, m.concepto, m.valor, fecha],
  );
  res.status(201).json({ id: r.insertId, ...m, origen: 'MANUAL', fecha });
}));

export default router;
