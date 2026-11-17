import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(raiz, '.env') });

function requerida(nombre) {
  const v = process.env[nombre];
  if (!v) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return v;
}

export const config = {
  raiz,
  port: Number(process.env.PORT || 4000),
  produccion: process.env.NODE_ENV === 'production',
  jwtSecret: requerida('JWT_SECRET'),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    name: requerida('DB_NAME'),
    user: requerida('DB_USER'),
    pass: requerida('DB_PASS'),
  },
};

if (config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}
