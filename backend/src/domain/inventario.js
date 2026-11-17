import { conflicto, noValido } from './errores.js';
import { aId, redondear } from './utilidades.js';

/**
 * Normaliza los ítems de una venta o compra: valida ids y cantidades
 * y agrupa los productos repetidos.
 * @returns {Map<number, {cantidad:number, costo?:number}>}
 */
export function agruparItems(items, { conCosto = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw noValido('Agregue al menos un producto');
  const mapa = new Map();
  for (const item of items) {
    const id = aId(item?.producto_id);
    const cantidad = Number(item?.cantidad);
    if (!id) throw noValido('Producto no válido');
    if (!Number.isInteger(cantidad) || cantidad <= 0) throw noValido('Las cantidades deben ser números enteros mayores que cero');
    let costo;
    if (conCosto) {
      costo = Number(item?.costo_unitario);
      if (!Number.isFinite(costo) || costo < 0) throw noValido('El costo no puede ser negativo');
    }
    const previo = mapa.get(id);
    if (previo) {
      previo.cantidad += cantidad;
      if (conCosto) previo.costo = costo; // se usa el último costo informado
    } else {
      mapa.set(id, conCosto ? { cantidad, costo } : { cantidad });
    }
  }
  return mapa;
}

/**
 * HU-03 CA-1/CA-3: calcula las líneas y el total de una venta y verifica existencias.
 * @param {Map<number,{cantidad:number}>} itemsAgrupados
 * @param {Map<number,{id,nombre,cantidad,precio_venta}>} productos productos de la tienda, por id
 */
export function calcularVenta(itemsAgrupados, productos) {
  const lineas = [];
  const faltantes = [];
  for (const [id, { cantidad }] of itemsAgrupados) {
    const p = productos.get(id);
    if (!p) throw noValido('Uno de los productos no existe en su inventario');
    if (cantidad > p.cantidad) {
      faltantes.push({ producto_id: id, nombre: p.nombre, disponible: p.cantidad, solicitado: cantidad });
      continue;
    }
    lineas.push({
      producto_id: id,
      nombre: p.nombre,
      cantidad,
      precio_unitario: redondear(p.precio_venta),
      subtotal: redondear(p.precio_venta * cantidad),
      nueva_cantidad: p.cantidad - cantidad,
    });
  }
  if (faltantes.length > 0) {
    const nombres = faltantes.map((f) => `${f.nombre} (quedan ${f.disponible})`).join(', ');
    throw conflicto(`No hay suficientes existencias: ${nombres}`, { faltantes });
  }
  const total = redondear(lineas.reduce((s, l) => s + l.subtotal, 0));
  return { lineas, total };
}

/** HU-03 CA-2: calcula las líneas y el total de una compra. */
export function calcularCompra(itemsAgrupados, productos) {
  const lineas = [];
  for (const [id, { cantidad, costo }] of itemsAgrupados) {
    const p = productos.get(id);
    if (!p) throw noValido('Uno de los productos no existe en su inventario');
    lineas.push({
      producto_id: id,
      nombre: p.nombre,
      cantidad,
      costo_unitario: redondear(costo),
      subtotal: redondear(costo * cantidad),
      nueva_cantidad: p.cantidad + cantidad,
    });
  }
  const total = redondear(lineas.reduce((s, l) => s + l.subtotal, 0));
  return { lineas, total };
}

/** HU-04 CA-2/CA-3: productos con existencias iguales o menores al mínimo. */
export function productosBajoMinimo(productos) {
  return productos
    .filter((p) => p.stock_minimo > 0 && p.cantidad <= p.stock_minimo)
    .map((p) => ({ id: p.id, nombre: p.nombre, cantidad: p.cantidad, stock_minimo: p.stock_minimo }))
    .sort((a, b) => a.cantidad - b.cantidad || a.nombre.localeCompare(b.nombre));
}
