import { noValido } from './errores.js';
import { esFechaValida } from './utilidades.js';

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

function lanzarSiHayErrores(errores) {
  if (Object.keys(errores).length > 0) {
    throw noValido('Revise los datos marcados', errores);
  }
}

function numeroNoNegativo(valor, campo, errores, { entero = false } = {}) {
  const n = Number(valor);
  if (valor === '' || valor === null || valor === undefined || Number.isNaN(n)) {
    errores[campo] = 'Debe ser un número';
  } else if (n < 0) {
    errores[campo] = 'No puede ser negativo';
  } else if (entero && !Number.isInteger(n)) {
    errores[campo] = 'Debe ser un número entero';
  }
  return n;
}

/** HU-01 CA-1: datos para crear la cuenta de la tienda. */
export function validarRegistro(datos) {
  const errores = {};
  const tienda = texto(datos?.tienda);
  const usuario = texto(datos?.usuario).toLowerCase();
  const password = typeof datos?.password === 'string' ? datos.password : '';

  if (tienda.length < 2 || tienda.length > 120) errores.tienda = 'Escriba el nombre de su tienda (2 a 120 letras)';
  if (!/^[a-z0-9._-]{3,60}$/.test(usuario)) errores.usuario = 'Use de 3 a 60 letras o números, sin espacios';
  if (password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (password.length > 72) errores.password = 'La contraseña no puede tener más de 72 caracteres';

  lanzarSiHayErrores(errores);
  return { tienda, usuario, password };
}

/** HU-01 CA-2/CA-3: datos de inicio de sesión. */
export function validarLogin(datos) {
  const usuario = texto(datos?.usuario).toLowerCase();
  const password = typeof datos?.password === 'string' ? datos.password : '';
  if (!usuario || !password) throw noValido('Escriba su usuario y su contraseña');
  return { usuario, password };
}

/** HU-02 CA-1/CA-4 y HU-04 CA-1: datos de un producto. */
export function validarProducto(datos) {
  const errores = {};
  const nombre = texto(datos?.nombre);
  if (nombre.length < 1 || nombre.length > 120) errores.nombre = 'Escriba el nombre del producto';

  const cantidad = numeroNoNegativo(datos?.cantidad, 'cantidad', errores, { entero: true });
  const precio_compra = numeroNoNegativo(datos?.precio_compra, 'precio_compra', errores);
  const precio_venta = numeroNoNegativo(datos?.precio_venta, 'precio_venta', errores);
  const stock_minimo = numeroNoNegativo(datos?.stock_minimo ?? 0, 'stock_minimo', errores, { entero: true });

  lanzarSiHayErrores(errores);
  return { nombre, cantidad, precio_compra, precio_venta, stock_minimo };
}

/** HU-05 CA-1: ingreso o gasto manual. */
export function validarMovimientoCaja(datos) {
  const errores = {};
  const tipo = texto(datos?.tipo).toUpperCase();
  const concepto = texto(datos?.concepto);
  const valor = Number(datos?.valor);
  const fecha = texto(datos?.fecha);

  if (!['INGRESO', 'EGRESO'].includes(tipo)) errores.tipo = 'Elija si es ingreso o gasto';
  if (concepto.length < 2 || concepto.length > 150) errores.concepto = 'Escriba el concepto';
  if (!Number.isFinite(valor) || valor <= 0) errores.valor = 'El valor debe ser mayor que cero';
  if (!esFechaValida(fecha)) errores.fecha = 'Elija una fecha válida';

  lanzarSiHayErrores(errores);
  return { tipo, concepto, valor, fecha };
}

/** HU-06: datos del cliente de fiado. */
export function validarCliente(datos) {
  const errores = {};
  const nombre = texto(datos?.nombre);
  const telefono = texto(datos?.telefono);
  if (nombre.length < 2 || nombre.length > 120) errores.nombre = 'Escriba el nombre del cliente';
  if (telefono && !/^[0-9 +()-]{7,20}$/.test(telefono)) errores.telefono = 'Teléfono no válido';
  lanzarSiHayErrores(errores);
  return { nombre, telefono: telefono || null };
}

/** HU-07: días de anticipación para avisar cobros. */
export function validarDiasAviso(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0 || n > 60) throw noValido('Los días de aviso deben estar entre 0 y 60');
  return n;
}
