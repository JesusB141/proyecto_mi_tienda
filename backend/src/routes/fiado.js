import { Router } from 'express';
import { enTransaccion, pool } from '../config/db.js';
import { ruta } from '../middleware/errores.js';
import { validarCliente } from '../domain/validaciones.js';
import { alertasDeCobro, aplicarAbono } from '../domain/fiado.js';
import { noEncontrado } from '../domain/errores.js';
import { aId, ahoraColombiaSQL, hoyColombia } from '../domain/utilidades.js';

export const clientes = Router();

// HU-06: clientes con su saldo pendiente total
clientes.get('/', ruta(async (req, res) => {
  const [filas] = await pool.query(
    `SELECT c.id, c.nombre, c.telefono,
            COALESCE(SUM(CASE WHEN d.pagada = 0 THEN d.saldo END), 0) AS saldo_pendiente
       FROM cliente c LEFT JOIN deuda d ON d.cliente_id = c.id
      WHERE c.tienda_id = ?
      GROUP BY c.id ORDER BY saldo_pendiente DESC, c.nombre`,
    [req.tiendaId],
  );
  res.json(filas);
}));

clientes.post('/', ruta(async (req, res) => {
  const c = validarCliente(req.body);
  const [r] = await pool.query(
    'INSERT INTO cliente (tienda_id, nombre, telefono) VALUES (?, ?, ?)',
    [req.tiendaId, c.nombre, c.telefono],
  );
  res.status(201).json({ id: r.insertId, ...c, saldo_pendiente: 0 });
}));

clientes.put('/:id', ruta(async (req, res) => {
  const id = aId(req.params.id);
  const c = validarCliente(req.body);
  const [r] = await pool.query(
    'UPDATE cliente SET nombre = ?, telefono = ? WHERE id = ? AND tienda_id = ?',
    [c.nombre, c.telefono, id, req.tiendaId],
  );
  if (!r.affectedRows) throw noEncontrado('El cliente no existe');
  res.json({ id, ...c });
}));

export const fiados = Router();

// HU-06: deudas de un cliente (o todas las pendientes)
fiados.get('/', ruta(async (req, res) => {
  const clienteId = aId(req.query.cliente_id);
  const [filas] = await pool.query(
    `SELECT d.id, d.venta_id, d.valor, d.saldo, d.fecha_pago_esperada, d.pagada,
            v.fecha AS fecha_venta, c.id AS cliente_id, c.nombre AS cliente
       FROM deuda d JOIN cliente c ON c.id = d.cliente_id JOIN venta v ON v.id = d.venta_id
      WHERE c.tienda_id = ? AND (? IS NULL OR c.id = ?) AND (? IS NOT NULL OR d.pagada = 0)
      ORDER BY d.pagada, d.fecha_pago_esperada`,
    [req.tiendaId, clienteId, clienteId, clienteId],
  );
  res.json(filas);
}));

// HU-07: alertas de cuentas por cobrar próximas a vencer o vencidas
fiados.get('/alertas', ruta(async (req, res) => {
  const [[tienda]] = await pool.query('SELECT dias_aviso_cobro FROM tienda WHERE id = ?', [req.tiendaId]);
  const [deudas] = await pool.query(
    `SELECT d.id, d.saldo, d.pagada, d.fecha_pago_esperada, c.nombre AS cliente
       FROM deuda d JOIN cliente c ON c.id = d.cliente_id
      WHERE c.tienda_id = ? AND d.pagada = 0`,
    [req.tiendaId],
  );
  res.json(alertasDeCobro(deudas, hoyColombia(), tienda.dias_aviso_cobro));
}));

// HU-06 CA-3/CA-4: registrar un pago (abono) y su ingreso en caja
fiados.post('/:id/abonos', ruta(async (req, res) => {
  const deudaId = aId(req.params.id);
  const fecha = ahoraColombiaSQL();
  const resultado = await enTransaccion(async (conn) => {
    const [filas] = await conn.query(
      `SELECT d.id, d.saldo, c.nombre AS cliente FROM deuda d JOIN cliente c ON c.id = d.cliente_id
        WHERE d.id = ? AND c.tienda_id = ? FOR UPDATE`,
      [deudaId, req.tiendaId],
    );
    if (!filas.length) throw noEncontrado('La cuenta no existe');
    const deuda = filas[0];
    const { valor, nuevoSaldo, pagada } = aplicarAbono(deuda.saldo, req.body?.valor);

    const [a] = await conn.query('INSERT INTO abono (deuda_id, valor, fecha) VALUES (?, ?, ?)', [deudaId, valor, fecha]);
    await conn.query('UPDATE deuda SET saldo = ?, pagada = ? WHERE id = ?', [nuevoSaldo, pagada ? 1 : 0, deudaId]);
    await conn.query(
      `INSERT INTO movimiento_caja (tienda_id, tipo, concepto, valor, origen, referencia_id, fecha)
       VALUES (?, 'INGRESO', ?, ?, 'ABONO', ?, ?)`,
      [req.tiendaId, `Pago de fiado: ${deuda.cliente}`, valor, a.insertId, fecha],
    );
    return { abono_id: a.insertId, valor, saldo: nuevoSaldo, pagada };
  });
  res.status(201).json(resultado);
}));
