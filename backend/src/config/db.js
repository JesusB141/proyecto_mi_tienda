import mysql from 'mysql2/promise';
import { config } from './env.js';

// Pool de conexiones. mysql2 usa consultas parametrizadas (?) para evitar inyección SQL.
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.pass,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
  timezone: 'Z',
});

/** Ejecuta fn dentro de una transacción; hace rollback si algo falla. */
export async function enTransaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
