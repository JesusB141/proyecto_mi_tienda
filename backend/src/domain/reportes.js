import { noValido } from './errores.js';
import { esFechaValida, redondear, sumarDias } from './utilidades.js';

/**
 * HU-08 CA-1: rango de fechas [desde, hasta] (inclusive) del periodo que contiene la fecha de referencia.
 * La semana va de lunes a domingo.
 */
export function rangoPeriodo(periodo, fechaRef) {
  if (!esFechaValida(fechaRef)) throw noValido('Fecha no válida');
  if (periodo === 'dia') return { desde: fechaRef, hasta: fechaRef };
  if (periodo === 'semana') {
    const diaSemana = new Date(`${fechaRef}T00:00:00Z`).getUTCDay(); // 0 = domingo
    const desde = sumarDias(fechaRef, -((diaSemana + 6) % 7));
    return { desde, hasta: sumarDias(desde, 6) };
  }
  if (periodo === 'mes') {
    const [a, m] = fechaRef.split('-').map(Number);
    const desde = `${a}-${String(m).padStart(2, '0')}-01`;
    const siguiente = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
    return { desde, hasta: sumarDias(siguiente, -1) };
  }
  throw noValido('El periodo debe ser día, semana o mes');
}

/**
 * HU-05 CA-3 y HU-08 CA-2/CA-3: totales de ingresos, egresos y utilidad estimada
 * a partir de los movimientos de caja registrados.
 */
export function resumenFinanciero(movimientos) {
  let ingresos = 0;
  let egresos = 0;
  const porConcepto = {};
  for (const m of movimientos) {
    const valor = Number(m.valor);
    if (m.tipo === 'INGRESO') ingresos += valor;
    else if (m.tipo === 'EGRESO') {
      egresos += valor;
      const clave = m.origen === 'COMPRA' ? 'Compras de mercancía' : m.concepto;
      porConcepto[clave] = (porConcepto[clave] || 0) + valor;
    }
  }
  const gastos = Object.entries(porConcepto)
    .map(([concepto, total]) => ({ concepto, total: redondear(total) }))
    .sort((a, b) => b.total - a.total);
  return {
    ingresos: redondear(ingresos),
    egresos: redondear(egresos),
    utilidad: redondear(ingresos - egresos),
    gastos_por_concepto: gastos,
  };
}
