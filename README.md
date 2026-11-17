# Sistema de Gestión de Finanzas de Tiendas de Barrio

Aplicación web responsiva para el control de inventario, caja y fiado en tiendas de barrio (Chinú, Córdoba).
Proyecto final — Gestión de Desarrollo de Software, CECAR.

**Equipo:** Jesús David Berdugo Fajardo · Daniel Andrés Puentes Pitalua · Jhon Alexander Yepes Cárdenas

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite (diseño responsivo, primero celular) |
| Backend / API | Node.js + Express (JavaScript en todo el proyecto) |
| Base de datos | MySQL 8.4 (en Docker) |
| Pruebas unitarias | `node:test` (corredor de pruebas nativo de Node) |
| Configuración | Git + GitHub |

> El documento de planeación (v6) definía el backend en PHP. El equipo lo cambió por **Node.js + Express** para usar un solo lenguaje (JavaScript) en frontend y backend y aprovechar librerías de seguridad maduras. Este cambio debe registrarse en el informe (secciones 6, 7 y 11) como una **solicitud de cambio aprobada**.

## Requisitos previos

- Node.js 20 o superior
- Docker Desktop (para MySQL)

## Puesta en marcha

1. Copiar la configuración y cambiar las contraseñas:
   ```bash
   cp .env.example .env
   ```
2. Levantar MySQL (crea la base de datos con `database/migrations/` la primera vez):
   ```bash
   docker compose up -d
   ```
3. Instalar dependencias:
   ```bash
   npm --prefix backend install
   npm --prefix frontend install
   ```
4. **Desarrollo** (dos terminales):
   ```bash
   npm --prefix backend run dev
   npm --prefix frontend run dev
   ```
   Abrir http://localhost:5173 (desde el celular en la misma red: `http://IP-del-PC:5173`).
5. **Versión ejecutable** (un solo servidor que entrega la API y la app compilada):
   ```bash
   npm --prefix frontend run build
   npm --prefix backend start
   ```
   Abrir http://localhost:4000

## Pruebas unitarias

```bash
npm --prefix backend test
npm --prefix backend run test:coverage
```

46 casos de prueba (CP-01 a CP-46) sobre las reglas de negocio de `backend/src/domain/`, cada uno ligado a una historia de usuario y a su criterio de aceptación. Evidencia para la sección 9 del informe.

## Estructura

```
02_Proyecto/
├── docker-compose.yml       # MySQL 8.4 con hora de Colombia (UTC-5)
├── .env.example             # Variables de entorno (el .env real NO se sube)
├── backend/
│   ├── src/
│   │   ├── domain/          # Reglas de negocio puras (probadas con pruebas unitarias)
│   │   ├── routes/          # Endpoints REST
│   │   ├── middleware/      # Sesión y manejo de errores
│   │   ├── config/          # Conexión a MySQL y variables de entorno
│   │   ├── app.js           # Configuración de Express
│   │   └── server.js        # Punto de entrada
│   └── tests/unit/          # Pruebas unitarias
├── frontend/
│   └── src/
│       ├── pages/           # Una pantalla por historia de usuario
│       ├── components/      # Layout, carrito, componentes de interfaz
│       └── services/        # Cliente de la API y sesión
├── database/migrations/     # 001_esquema_inicial.sql
├── docs/
└── release/
```

## Trazabilidad HU → código

| HU | Funcionalidad | API | Pantalla | Pruebas |
|---|---|---|---|---|
| HU-01 | Registro e inicio de sesión | `POST /api/auth/registro`, `/login`, `/logout`, `GET /yo` | `Acceso.jsx` | CP-01 a CP-05 |
| HU-02 | Gestión de productos | `GET/POST/PUT/DELETE /api/productos` | `Productos.jsx` | CP-06 a CP-10 |
| HU-03 | Ventas y compras | `POST /api/ventas`, `POST /api/compras` | `Vender.jsx`, `Comprar.jsx` | CP-17 a CP-26 |
| HU-04 | Alerta de stock mínimo | `GET /api/productos/alertas` | `Inicio.jsx`, `Productos.jsx` | CP-27 a CP-29 |
| HU-05 | Ingresos y gastos | `GET/POST /api/caja` | `Caja.jsx` | CP-11 a CP-13, CP-43 |
| HU-06 | Fiado | `/api/clientes`, `GET /api/fiados`, `POST /api/fiados/:id/abonos` | `Vender.jsx`, `Fiado.jsx` | CP-14, CP-15, CP-30 a CP-34 |
| HU-07 | Alertas de cobro | `GET /api/fiados/alertas`, `PUT /api/auth/configuracion` | `Inicio.jsx`, `Fiado.jsx` | CP-16, CP-35 a CP-38 |
| HU-08 | Reportes | `GET /api/reportes?periodo=dia\|semana\|mes` | `Reportes.jsx` | CP-39 a CP-44 |
| HU-09 | Historial | `GET /api/historial/inventario`, `/caja` | `Historial.jsx` | CP-45, CP-46 |
| HU-10 | Acceso web desde el celular | Express entrega la app compilada | diseño responsivo (`index.css`) | prueba manual en 375 px |

## Seguridad (RNF-05)

| Riesgo | Control aplicado |
|---|---|
| Inyección SQL | Todas las consultas son parametrizadas (`?`) con `mysql2` |
| Robo de sesión por XSS | Token JWT en cookie `httpOnly` (JavaScript no puede leerla) |
| CSRF | Cookie `SameSite=Strict`; `Secure` en producción |
| Contraseñas | Hash con `bcrypt` (costo 12); nunca se guardan en texto plano |
| Fuerza bruta | Límite de 20 intentos de login o registro cada 15 minutos por IP |
| Enumeración de usuarios | Mismo mensaje si el usuario no existe o la contraseña es incorrecta |
| Acceso a datos ajenos | Cada consulta filtra por la tienda de la sesión (`tienda_id`) |
| Cabeceras HTTP | `helmet` (CSP, HSTS, X-Content-Type-Options, etc.) |
| Datos sensibles en el repositorio | `.env` excluido por `.gitignore`; solo se versiona `.env.example` |
| Integridad de inventario | Ventas, compras y pagos en transacciones con bloqueo `FOR UPDATE` |

## Gestión de la configuración (resumen para la sección 11)

- **Ramas:** `main` (versiones estables) · `develop` (integración) · `feature/HU-xx-descripcion`.
- **Commits:** `HU-02: agrega API de registro de productos`.
- **Versiones / líneas base:** una etiqueta por incremento: `v0.1.0`, `v0.2.0`, … `v1.0.0` (entrega final).
- **Control de cambios:** issue en GitHub → rama `feature` → Pull Request revisado por otro integrante → merge a `develop` → release a `main`.
