import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { alertasDeCobro, aplicarAbono, validarFechaPago } from '../../src/domain/fiado.js';
import { rangoPeriodo, resumenFinanciero } from '../../src/domain/reportes.js';
import { esFechaValida, hoyColombia, sumarDias } from '../../src/domain/utilidades.js';

describe('HU-06 · fiado', () => {
  it('CP-30: abono parcial deja saldo pendiente', () => {
    assert.deepEqual(aplicarAbono(50000, 20000), { valor: 20000, nuevoSaldo: 30000, pagada: false });
  });
  it('CP-31: abono por el total deja la cuenta saldada (CA-3)', () => {
    assert.equal(aplicarAbono(50000, 50000).pagada, true);
  });
  it('CP-32: rechaza abonos mayores que la deuda', () => {
    assert.throws(() => aplicarAbono(10000, 15000), { status: 400 });
  });
  it('CP-33: rechaza abonos a cuentas ya pagadas', () => {
    assert.throws(() => aplicarAbono(0, 1000), { status: 400 });
  });
  it('CP-34: la fecha de pago no puede ser anterior a la venta (CA-1)', () => {
    assert.throws(() => validarFechaPago('2026-11-01', '2026-11-17'), { status: 400 });
    assert.equal(validarFechaPago('2026-11-30', '2026-11-17'), '2026-11-30');
  });
});

describe('HU-07 · alertasDeCobro', () => {
  const hoy = '2026-11-17';
  const deudas = [
    { id: 1, cliente: 'Ana', saldo: 10000, pagada: 0, fecha_pago_esperada: '2026-11-19' },
    { id: 2, cliente: 'Luis', saldo: 5000, pagada: 0, fecha_pago_esperada: '2026-11-30' },
    { id: 3, cliente: 'Marta', saldo: 0, pagada: 1, fecha_pago_esperada: '2026-11-15' },
    { id: 4, cliente: 'Pedro', saldo: 7000, pagada: 0, fecha_pago_esperada: '2026-11-10' },
  ];
  it('CP-35: alerta cuentas dentro de los días de aviso y vencidas (CA-1)', () => {
    assert.deepEqual(alertasDeCobro(deudas, hoy, 3).map((a) => a.cliente), ['Pedro', 'Ana']);
  });
  it('CP-36: la alerta muestra cliente y valor pendiente (CA-2)', () => {
    const ana = alertasDeCobro(deudas, hoy, 3).find((a) => a.cliente === 'Ana');
    assert.equal(ana.saldo, 10000);
    assert.equal(ana.estado, 'por_vencer');
    assert.equal(ana.dias_restantes, 2);
  });
  it('CP-37: las cuentas pagadas no generan alerta (CA-3)', () => {
    assert.ok(!alertasDeCobro(deudas, hoy, 30).some((a) => a.cliente === 'Marta'));
  });
  it('CP-38: marca como vencidas las que pasaron la fecha', () => {
    assert.equal(alertasDeCobro(deudas, hoy, 0).find((a) => a.cliente === 'Pedro').estado, 'vencida');
  });
});

describe('HU-08 · reportes', () => {
  it('CP-39: rango del día', () => {
    assert.deepEqual(rangoPeriodo('dia', '2026-11-17'), { desde: '2026-11-17', hasta: '2026-11-17' });
  });
  it('CP-40: la semana va de lunes a domingo', () => {
    // 17 de noviembre de 2026 es martes
    assert.deepEqual(rangoPeriodo('semana', '2026-11-17'), { desde: '2026-11-16', hasta: '2026-11-22' });
    assert.deepEqual(rangoPeriodo('semana', '2026-11-22'), { desde: '2026-11-16', hasta: '2026-11-22' });
  });
  it('CP-41: el mes incluye su último día (incluye diciembre y febrero bisiesto)', () => {
    assert.deepEqual(rangoPeriodo('mes', '2026-12-05'), { desde: '2026-12-01', hasta: '2026-12-31' });
    assert.deepEqual(rangoPeriodo('mes', '2028-02-10'), { desde: '2028-02-01', hasta: '2028-02-29' });
  });
  it('CP-42: rechaza periodos no válidos', () => {
    assert.throws(() => rangoPeriodo('año', '2026-11-17'), { status: 400 });
  });
  it('CP-43: calcula ingresos, gastos y utilidad que coinciden con los movimientos (CA-2/CA-3)', () => {
    const r = resumenFinanciero([
      { tipo: 'INGRESO', concepto: 'Venta #1', valor: 30000, origen: 'VENTA' },
      { tipo: 'INGRESO', concepto: 'Pago de fiado', valor: 10000, origen: 'ABONO' },
      { tipo: 'EGRESO', concepto: 'Compra #1', valor: 15000, origen: 'COMPRA' },
      { tipo: 'EGRESO', concepto: 'Luz', valor: 5000.5, origen: 'MANUAL' },
    ]);
    assert.equal(r.ingresos, 40000);
    assert.equal(r.egresos, 20000.5);
    assert.equal(r.utilidad, 19999.5);
    assert.deepEqual(r.gastos_por_concepto[0], { concepto: 'Compras de mercancía', total: 15000 });
  });
  it('CP-44: sin movimientos, todo en cero', () => {
    assert.deepEqual(resumenFinanciero([]), { ingresos: 0, egresos: 0, utilidad: 0, gastos_por_concepto: [] });
  });
});

describe('Utilidades de fecha', () => {
  it('CP-45: hoy en Colombia usa UTC-5 (a las 2 a. m. UTC todavía es el día anterior)', () => {
    assert.equal(hoyColombia(new Date('2026-11-18T02:00:00Z')), '2026-11-17');
  });
  it('CP-46: valida fechas y suma días cruzando meses', () => {
    assert.ok(esFechaValida('2026-11-17'));
    assert.ok(!esFechaValida('17/11/2026'));
    assert.equal(sumarDias('2026-11-30', 1), '2026-12-01');
  });
});
