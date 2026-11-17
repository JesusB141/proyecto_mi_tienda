import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config/env.js';
import { manejadorErrores } from './middleware/errores.js';
import { requiereSesion } from './middleware/sesion.js';
import auth from './routes/auth.js';
import productos from './routes/productos.js';
import { ventas, compras } from './routes/movimientos.js';
import caja from './routes/caja.js';
import { clientes, fiados } from './routes/fiado.js';
import { reportes, historial } from './routes/reportes.js';

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet()); // cabeceras de seguridad (CSP, HSTS, no-sniff, etc.)
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/salud', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', auth);

  // Todo lo demás exige sesión; cada consulta filtra por la tienda del usuario.
  app.use('/api', requiereSesion);
  app.use('/api/productos', productos);
  app.use('/api/ventas', ventas);
  app.use('/api/compras', compras);
  app.use('/api/caja', caja);
  app.use('/api/clientes', clientes);
  app.use('/api/fiados', fiados);
  app.use('/api/reportes', reportes);
  app.use('/api/historial', historial);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // En producción, el mismo servidor entrega la aplicación React compilada (HU-10).
  const dist = path.join(config.raiz, 'frontend', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(manejadorErrores);
  return app;
}
