import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agruparItems, calcularCompra, calcularVenta, productosBajoMinimo } from '../../src/domain/inventario.js';

const productos = new Map([
  [1, { id: 1, nombre: 'Arroz', cantidad: 10, precio_venta: 2500 }],
  [2, { id: 2, nombre: 'Aceite', cantidad: 2, precio_venta: 8900 }],
]);

describe('HU-03 · agruparItems', () => {
  it('CP-17: agrupa productos repetidos sumando cantidades', () => {
    const m = agruparItems([{ producto_id: 1, cantidad: 2 }, { producto_id: 1, cantidad: 3 }]);
    assert.equal(m.get(1).cantidad, 5);
  });
  it('CP-18: rechaza lista vacía', () => {
    assert.throws(() => agruparItems([]), { status: 400 });
  });
  it('CP-19: rechaza cantidades en cero o negativas', () => {
    assert.throws(() => agruparItems([{ producto_id: 1, cantidad: 0 }]), { status: 400 });
  });
});

describe('HU-03 · calcularVenta', () => {
  it('CP-20: calcula total y descuenta existencias (CA-1)', () => {
    const { lineas, total } = calcularVenta(agruparItems([{ producto_id: 1, cantidad: 3 }, { producto_id: 2, cantidad: 1 }]), productos);
    assert.equal(total, 3 * 2500 + 8900);
    assert.equal(lineas.find((l) => l.producto_id === 1).nueva_cantidad, 7);
  });
  it('CP-21: advierte cuando la venta supera las existencias (CA-3)', () => {
    assert.throws(
      () => calcularVenta(agruparItems([{ producto_id: 2, cantidad: 5 }]), productos),
      (err) => err.status === 409 && /Aceite \(quedan 2\)/.test(err.message),
    );
  });
  it('CP-22: permite vender exactamente lo que queda', () => {
    const { lineas } = calcularVenta(agruparItems([{ producto_id: 2, cantidad: 2 }]), productos);
    assert.equal(lineas[0].nueva_cantidad, 0);
  });
  it('CP-23: rechaza productos que no son de la tienda', () => {
    assert.throws(() => calcularVenta(agruparItems([{ producto_id: 99, cantidad: 1 }]), productos), { status: 400 });
  });
  it('CP-24: evita errores de redondeo en el total', () => {
    const p = new Map([[1, { id: 1, nombre: 'Dulce', cantidad: 10, precio_venta: 0.1 }]]);
    assert.equal(calcularVenta(agruparItems([{ producto_id: 1, cantidad: 3 }]), p).total, 0.3);
  });
});

describe('HU-03 · calcularCompra', () => {
  it('CP-25: suma las unidades recibidas al inventario (CA-2)', () => {
    const { lineas, total } = calcularCompra(agruparItems([{ producto_id: 2, cantidad: 12, costo_unitario: 7000 }], { conCosto: true }), productos);
    assert.equal(lineas[0].nueva_cantidad, 14);
    assert.equal(total, 84000);
  });
  it('CP-26: rechaza costo negativo', () => {
    assert.throws(() => agruparItems([{ producto_id: 2, cantidad: 1, costo_unitario: -1 }], { conCosto: true }), { status: 400 });
  });
});

describe('HU-04 · productosBajoMinimo', () => {
  const lista = [
    { id: 1, nombre: 'Arroz', cantidad: 10, stock_minimo: 5 },
    { id: 2, nombre: 'Aceite', cantidad: 2, stock_minimo: 3 },
    { id: 3, nombre: 'Sal', cantidad: 3, stock_minimo: 3 },
    { id: 4, nombre: 'Panela', cantidad: 0, stock_minimo: 0 },
  ];
  it('CP-27: alerta cuando las existencias son iguales o menores al mínimo (CA-2)', () => {
    assert.deepEqual(productosBajoMinimo(lista).map((p) => p.nombre), ['Aceite', 'Sal']);
  });
  it('CP-28: la alerta indica producto y unidades que quedan (CA-3)', () => {
    assert.deepEqual(productosBajoMinimo(lista)[0], { id: 2, nombre: 'Aceite', cantidad: 2, stock_minimo: 3 });
  });
  it('CP-29: no alerta productos sin mínimo configurado', () => {
    assert.ok(!productosBajoMinimo(lista).some((p) => p.nombre === 'Panela'));
  });
});
