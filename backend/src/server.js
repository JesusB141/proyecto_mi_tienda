import { crearApp } from './app.js';
import { config } from './config/env.js';

crearApp().listen(config.port, () => {
  console.log(`API de Tiendas de Barrio escuchando en http://localhost:${config.port}`);
});
