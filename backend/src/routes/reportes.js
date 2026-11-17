import { Router } from 'express';
import { pool } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { rangoPeriodo, resumenFinanciero } from '../domain/reportes.js';
import { noValido } from '../domain/errores.js';
import { esFechaValida, hoyColombia, sumarDias } from '../domain/utilidades.js';

export const reportes = Router();

// HU-08 CA-1/CA-2/CA-3: ingresos, gastos y utilidad estimada del periodo
reportes.get('/', ruta(async (req, res) => {
  const periodo = req.query.periodo || 'dia';
  const { desde, hasta } = rangoPeriodo(periodo, req.query.fecha || hoyColombia());
  const [movimientos] = await pool.query(
    `SELECT tipo, concepto, valor, origen FROM movimiento_caja
      WHERE tienda_id = ? AND fecha >= ? AND fecha < ?`,
    [req.tiendaId, desde, sumarDias(hasta, 1)],
  );
  const [[ventas]] = await pool.query(
    `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total,
            COALESCE(SUM(CASE WHEN es_credito = 1 THEN total END), 0) AS fiado
       FROM venta WHERE tienda_id = ? AND fecha >= ? AND fecha < ?`,
    [req.tiendaId, desde, sumarDias(hasta, 1)],
  );
  res.json({ periodo, desde, hasta, ...resumenFinanciero(movimientos), ventas });
}));

/** Lee y valida el rango de fechas del historial (por defecto, los últimos 30 días). */
function rangoHistorial(query) {
  const hasta = query.hasta || hoyColombia();
  const desde = query.desde || sumarDias(hasta, -30);
  if (!esFechaValida(desde) || !esFechaValida(hasta)) throw noValido('Fechas no válidas');
  if (desde > hasta) throw noValido('La fecha inicial no puede ser posterior a la final');
  return { desde, hastaExclusivo: sumarDias(hasta, 1) };
}

export const historial = Router();

// HU-09 CA-1/CA-2/CA-3: historial de inventario (ventas y compras por producto)
historial.get('/inventario', ruta(async (req, res) => {
  const { desde, hastaExclusivo } = rangoHistorial(req.query);
  const tipo = String(req.query.tipo || '').toUpperCase();
  const [filas] = await pool.query(
    `SELECT * FROM (
       SELECT v.fecha, 'VENTA' AS tipo, p.nombre AS producto, dv.cantidad, dv.precio_unitario AS valor_unitario
         FROM detalle_venta dv JOIN venta v ON v.id = dv.venta_id JOIN producto p ON p.id = dv.producto_id
        WHERE v.tienda_id = ? AND v.fecha >= ? AND v.fecha < ?
       UNION ALL
       SELECT c.fecha, 'COMPRA' AS tipo, p.nombre, dc.cantidad, dc.costo_unitario
         FROM detalle_compra dc JOIN compra c ON c.id = dc.compra_id JOIN producto p ON p.id = dc.producto_id
        WHERE c.tienda_id = ? AND c.fecha >= ? AND c.fecha < ?
     ) h
     WHERE (? = '' OR h.tipo = ?)
     ORDER BY h.fecha DESC LIMIT 500`,
    [req.tiendaId, desde, hastaExclusivo, req.tiendaId, desde, hastaExclusivo, tipo, tipo],
  );
  res.json(filas);
}));

// HU-09: historial de caja
historial.get('/caja', ruta(async (req, res) => {
  const { desde, hastaExclusivo } = rangoHistorial(req.query);
  const tipo = String(req.query.tipo || '').toUpperCase();
  const [filas] = await pool.query(
    `SELECT fecha, tipo, concepto, valor, origen FROM movimiento_caja
      WHERE tienda_id = ? AND fecha >= ? AND fecha < ? AND (? = '' OR tipo = ?)
      ORDER BY fecha DESC, id DESC LIMIT 500`,
    [req.tiendaId, desde, hastaExclusivo, tipo, tipo],
  );
  res.json(filas);
}));
