import { Router } from 'express';
import { enTransaccion, pool } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { agruparItems, calcularCompra, calcularVenta } from '../domain/inventario.js';
import { validarFechaPago } from '../domain/fiado.js';
import { noValido } from '../domain/errores.js';
import { aId, ahoraColombiaSQL } from '../domain/utilidades.js';

/** Carga y bloquea (FOR UPDATE) los productos de la tienda involucrados en la operación. */
async function productosBloqueados(conn, tiendaId, ids) {
  const [filas] = await conn.query(
    `SELECT id, nombre, cantidad, precio_venta FROM producto
      WHERE tienda_id = ? AND activo = 1 AND id IN (?) FOR UPDATE`,
    [tiendaId, ids],
  );
  return new Map(filas.map((p) => [p.id, p]));
}

export const ventas = Router();

/**
 * HU-03 CA-1/CA-3/CA-4: registra una venta y descuenta existencias.
 * HU-05 CA-2: una venta de contado genera su ingreso en caja.
 * HU-06 CA-1/CA-2: una venta a crédito genera la deuda (fiado) y también descuenta existencias.
 */
ventas.post('/', ruta(async (req, res) => {
  const items = agruparItems(req.body?.items);
  const credito = req.body?.credito;
  const fecha = ahoraColombiaSQL();

  const resultado = await enTransaccion(async (conn) => {
    const productos = await productosBloqueados(conn, req.tiendaId, [...items.keys()]);
    const { lineas, total } = calcularVenta(items, productos);

    let clienteId = null;
    let fechaPago = null;
    if (credito) {
      clienteId = aId(credito.cliente_id);
      const [c] = await conn.query('SELECT id, nombre FROM cliente WHERE id = ? AND tienda_id = ?', [clienteId, req.tiendaId]);
      if (!c.length) throw noValido('Elija el cliente al que le va a fiar');
      fechaPago = validarFechaPago(credito.fecha_pago_esperada, fecha.slice(0, 10));
    }

    const [v] = await conn.query(
      'INSERT INTO venta (tienda_id, cliente_id, es_credito, total, fecha) VALUES (?, ?, ?, ?, ?)',
      [req.tiendaId, clienteId, credito ? 1 : 0, total, fecha],
    );
    for (const l of lineas) {
      await conn.query(
        'INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [v.insertId, l.producto_id, l.cantidad, l.precio_unitario],
      );
      await conn.query('UPDATE producto SET cantidad = ? WHERE id = ?', [l.nueva_cantidad, l.producto_id]);
    }

    if (credito) {
      await conn.query(
        'INSERT INTO deuda (cliente_id, venta_id, valor, saldo, fecha_pago_esperada) VALUES (?, ?, ?, ?, ?)',
        [clienteId, v.insertId, total, total, fechaPago],
      );
    } else {
      await conn.query(
        `INSERT INTO movimiento_caja (tienda_id, tipo, concepto, valor, origen, referencia_id, fecha)
         VALUES (?, 'INGRESO', ?, ?, 'VENTA', ?, ?)`,
        [req.tiendaId, `Venta #${v.insertId}`, total, v.insertId, fecha],
      );
    }
    return { venta_id: v.insertId, total, fecha, credito: Boolean(credito), lineas };
  });
  res.status(201).json(resultado);
}));

export const compras = Router();

/** HU-03 CA-2/CA-4: registra una compra, suma existencias y (opcional) registra el gasto en caja. */
compras.post('/', ruta(async (req, res) => {
  const items = agruparItems(req.body?.items, { conCosto: true });
  const registrarEnCaja = req.body?.registrar_en_caja !== false;
  const fecha = ahoraColombiaSQL();

  const resultado = await enTransaccion(async (conn) => {
    const productos = await productosBloqueados(conn, req.tiendaId, [...items.keys()]);
    const { lineas, total } = calcularCompra(items, productos);

    const [c] = await conn.query(
      'INSERT INTO compra (tienda_id, total, fecha) VALUES (?, ?, ?)',
      [req.tiendaId, total, fecha],
    );
    for (const l of lineas) {
      await conn.query(
        'INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario) VALUES (?, ?, ?, ?)',
        [c.insertId, l.producto_id, l.cantidad, l.costo_unitario],
      );
      await conn.query(
        'UPDATE producto SET cantidad = ?, precio_compra = ? WHERE id = ?',
        [l.nueva_cantidad, l.costo_unitario, l.producto_id],
      );
    }
    if (registrarEnCaja && total > 0) {
      await conn.query(
        `INSERT INTO movimiento_caja (tienda_id, tipo, concepto, valor, origen, referencia_id, fecha)
         VALUES (?, 'EGRESO', ?, ?, 'COMPRA', ?, ?)`,
        [req.tiendaId, `Compra de mercancía #${c.insertId}`, total, c.insertId, fecha],
      );
    }
    return { compra_id: c.insertId, total, fecha, lineas };
  });
  res.status(201).json(resultado);
}));

// Últimas ventas, útil para la pantalla de inicio
ventas.get('/', ruta(async (req, res) => {
  const [filas] = await pool.query(
    `SELECT v.id, v.fecha, v.total, v.es_credito, c.nombre AS cliente
       FROM venta v LEFT JOIN cliente c ON c.id = v.cliente_id
      WHERE v.tienda_id = ? ORDER BY v.fecha DESC, v.id DESC LIMIT 20`,
    [req.tiendaId],
  );
  res.json(filas);
}));
