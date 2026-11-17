import { noValido } from './errores.js';
import { diferenciaDias, esFechaValida, redondear, sumarDias } from './utilidades.js';

/** HU-06 CA-1: la fecha de pago esperada debe ser válida y no anterior a la venta. */
export function validarFechaPago(fechaPago, fechaVenta) {
  if (!esFechaValida(fechaPago)) throw noValido('Elija la fecha en que el cliente va a pagar');
  if (fechaPago < fechaVenta) throw noValido('La fecha de pago no puede ser anterior a la fecha de la venta');
  return fechaPago;
}

/** HU-06 CA-3: aplica un abono a una deuda y dice si queda saldada. */
export function aplicarAbono(saldoActual, valor) {
  const v = Number(valor);
  const saldo = redondear(saldoActual);
  if (!Number.isFinite(v) || v <= 0) throw noValido('El abono debe ser mayor que cero');
  if (saldo <= 0) throw noValido('Esta cuenta ya está pagada');
  if (redondear(v) > saldo) throw noValido(`El abono no puede ser mayor que lo que debe (${saldo})`);
  const nuevoSaldo = redondear(saldo - v);
  return { valor: redondear(v), nuevoSaldo, pagada: nuevoSaldo === 0 };
}

/**
 * HU-07: cuentas por cobrar que deben mostrarse como alerta.
 * CA-1: aparecen cuando faltan diasAviso días o menos para la fecha de pago (incluye vencidas).
 * CA-2: muestran cliente y valor pendiente. CA-3: las pagadas no generan alerta.
 */
export function alertasDeCobro(deudas, hoy, diasAviso) {
  const limite = sumarDias(hoy, diasAviso);
  return deudas
    .filter((d) => !d.pagada && Number(d.saldo) > 0 && d.fecha_pago_esperada <= limite)
    .map((d) => {
      const dias = diferenciaDias(hoy, d.fecha_pago_esperada);
      return {
        deuda_id: d.id,
        cliente: d.cliente,
        saldo: redondear(d.saldo),
        fecha_pago_esperada: d.fecha_pago_esperada,
        dias_restantes: dias,
        estado: dias < 0 ? 'vencida' : dias === 0 ? 'vence_hoy' : 'por_vencer',
      };
    })
    .sort((a, b) => a.dias_restantes - b.dias_restantes);
}
