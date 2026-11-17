import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarCliente, validarDiasAviso, validarLogin, validarMovimientoCaja, validarProducto, validarRegistro,
} from '../../src/domain/validaciones.js';
import { ErrorNegocio } from '../../src/domain/errores.js';

const esError400 = (campo) => (err) => {
  assert.ok(err instanceof ErrorNegocio);
  assert.equal(err.status, 400);
  if (campo) assert.ok(err.detalles?.[campo], `se esperaba error en ${campo}`);
  return true;
};

describe('HU-01 · validarRegistro', () => {
  it('CP-01: acepta datos válidos y normaliza el usuario', () => {
    const r = validarRegistro({ tienda: '  Tienda Doña Rosa ', usuario: 'DonaRosa', password: 'clave1234' });
    assert.deepEqual(r, { tienda: 'Tienda Doña Rosa', usuario: 'donarosa', password: 'clave1234' });
  });
  it('CP-02: rechaza contraseña de menos de 8 caracteres', () => {
    assert.throws(() => validarRegistro({ tienda: 'Tienda', usuario: 'rosa', password: '123' }), esError400('password'));
  });
  it('CP-03: rechaza usuario con espacios', () => {
    assert.throws(() => validarRegistro({ tienda: 'Tienda', usuario: 'doña rosa', password: 'clave1234' }), esError400('usuario'));
  });
  it('CP-04: rechaza nombre de tienda vacío', () => {
    assert.throws(() => validarRegistro({ tienda: ' ', usuario: 'rosa', password: 'clave1234' }), esError400('tienda'));
  });
});

describe('HU-01 · validarLogin', () => {
  it('CP-05: exige usuario y contraseña (CA-3)', () => {
    assert.throws(() => validarLogin({ usuario: 'rosa' }), esError400());
  });
});

describe('HU-02 · validarProducto', () => {
  const base = { nombre: 'Arroz 500 g', cantidad: 10, precio_compra: 2000, precio_venta: 2500, stock_minimo: 3 };
  it('CP-06: acepta un producto válido (CA-1)', () => {
    assert.deepEqual(validarProducto(base), base);
  });
  it('CP-07: rechaza cantidad negativa (CA-4)', () => {
    assert.throws(() => validarProducto({ ...base, cantidad: -1 }), esError400('cantidad'));
  });
  it('CP-08: rechaza precio negativo (CA-4)', () => {
    assert.throws(() => validarProducto({ ...base, precio_venta: -500 }), esError400('precio_venta'));
  });
  it('CP-09: rechaza cantidad con decimales', () => {
    assert.throws(() => validarProducto({ ...base, cantidad: 2.5 }), esError400('cantidad'));
  });
  it('CP-10: el stock mínimo es 0 si no se indica (HU-04)', () => {
    const { stock_minimo: _omitido, ...sinMinimo } = base;
    assert.equal(validarProducto(sinMinimo).stock_minimo, 0);
  });
});

describe('HU-05 · validarMovimientoCaja', () => {
  it('CP-11: acepta un gasto válido (CA-1)', () => {
    const m = validarMovimientoCaja({ tipo: 'egreso', concepto: 'Pago de luz', valor: 45000, fecha: '2026-11-17' });
    assert.equal(m.tipo, 'EGRESO');
  });
  it('CP-12: rechaza valor cero', () => {
    assert.throws(() => validarMovimientoCaja({ tipo: 'INGRESO', concepto: 'x y', valor: 0, fecha: '2026-11-17' }), esError400('valor'));
  });
  it('CP-13: rechaza fecha inexistente', () => {
    assert.throws(() => validarMovimientoCaja({ tipo: 'INGRESO', concepto: 'Venta', valor: 10, fecha: '2026-02-30' }), esError400('fecha'));
  });
});

describe('HU-06/HU-07 · clientes y configuración', () => {
  it('CP-14: acepta cliente sin teléfono', () => {
    assert.deepEqual(validarCliente({ nombre: 'Carlos Pérez' }), { nombre: 'Carlos Pérez', telefono: null });
  });
  it('CP-15: rechaza teléfono con letras', () => {
    assert.throws(() => validarCliente({ nombre: 'Carlos', telefono: 'abc' }), esError400('telefono'));
  });
  it('CP-16: días de aviso entre 0 y 60', () => {
    assert.equal(validarDiasAviso('5'), 5);
    assert.throws(() => validarDiasAviso(90), esError400());
  });
});
