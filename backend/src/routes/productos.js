import { Router } from 'express';
import { pool } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { validarProducto } from '../domain/validaciones.js';
import { productosBajoMinimo } from '../domain/inventario.js';
import { noEncontrado } from '../domain/errores.js';
import { aId } from '../domain/utilidades.js';

const router = Router();
const COLUMNAS = 'id, nombre, cantidad, precio_compra, precio_venta, stock_minimo';

// HU-02: listado de productos activos (con búsqueda opcional)
router.get('/', ruta(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM producto
      WHERE tienda_id = ? AND activo = 1 AND (? = '' OR nombre LIKE CONCAT('%', ?, '%'))
      ORDER BY nombre`,
    [req.tiendaId, q, q],
  );
  res.json(filas);
}));

// HU-04: productos en o por debajo del stock mínimo
router.get('/alertas', ruta(async (req, res) => {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM producto WHERE tienda_id = ? AND activo = 1`,
    [req.tiendaId],
  );
  res.json(productosBajoMinimo(filas));
}));

// HU-02 CA-1: registrar producto
router.post('/', ruta(async (req, res) => {
  const p = validarProducto(req.body);
  const [r] = await pool.query(
    `INSERT INTO producto (tienda_id, nombre, cantidad, precio_compra, precio_venta, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.tiendaId, p.nombre, p.cantidad, p.precio_compra, p.precio_venta, p.stock_minimo],
  );
  res.status(201).json({ id: r.insertId, ...p });
}));

// HU-02 CA-2: editar producto
router.put('/:id', ruta(async (req, res) => {
  const id = aId(req.params.id);
  const p = validarProducto(req.body);
  const [r] = await pool.query(
    `UPDATE producto SET nombre = ?, cantidad = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?
      WHERE id = ? AND tienda_id = ? AND activo = 1`,
    [p.nombre, p.cantidad, p.precio_compra, p.precio_venta, p.stock_minimo, id, req.tiendaId],
  );
  if (!r.affectedRows) throw noEncontrado('El producto no existe');
  res.json({ id, ...p });
}));

// HU-02 CA-3: eliminar producto (la confirmación se pide en la interfaz).
// Se desactiva en lugar de borrarlo para conservar el historial de ventas y compras.
router.delete('/:id', ruta(async (req, res) => {
  const id = aId(req.params.id);
  const [r] = await pool.query(
    'UPDATE producto SET activo = 0 WHERE id = ? AND tienda_id = ? AND activo = 1',
    [id, req.tiendaId],
  );
  if (!r.affectedRows) throw noEncontrado('El producto no existe');
  res.json({ ok: true });
}));

export default router;
