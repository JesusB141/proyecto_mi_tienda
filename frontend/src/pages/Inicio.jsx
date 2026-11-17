import { Link } from 'react-router-dom';
import { api, pesos, soloFecha } from '../services/api.js';
import { useSesion } from '../services/sesion.jsx';
import { Cifra, Mensaje, Tarjeta, Vacio, useDatos } from '../components/ui.jsx';

const ACCESOS = [
  { a: '/vender', texto: 'Vender', icono: '🛒' },
  { a: '/comprar', texto: 'Comprar mercancía', icono: '🚚' },
  { a: '/caja', texto: 'Anotar gasto', icono: '💸' },
  { a: '/fiado', texto: 'Fiado', icono: '📒' },
];

/** Pantalla principal: caja del día y alertas de stock (HU-04) y de cobro (HU-07). */
export default function Inicio() {
  const { usuario } = useSesion();
  const caja = useDatos(() => api.get('/caja'));
  const stock = useDatos(() => api.get('/productos/alertas'));
  const cobros = useDatos(() => api.get('/fiados/alertas'));

  return (
    <>
      <h1 className="titulo">Hola, {usuario.usuario}</h1>

      <div className="accesos">
        {ACCESOS.map((x) => (
          <Link key={x.a + x.texto} to={x.a} className="acceso-rapido">
            <span aria-hidden="true">{x.icono}</span>{x.texto}
          </Link>
        ))}
      </div>

      <Tarjeta titulo="Caja de hoy" accion={<Link to="/caja">Ver detalle</Link>}>
        <Mensaje tipo="error">{caja.error}</Mensaje>
        <div className="cifras">
          <Cifra etiqueta="Entró" valor={pesos(caja.datos?.ingresos)} tono="positivo" />
          <Cifra etiqueta="Salió" valor={pesos(caja.datos?.egresos)} tono="negativo" />
          <Cifra etiqueta="Saldo" valor={pesos(caja.datos?.saldo)} />
        </div>
      </Tarjeta>

      <Tarjeta titulo={`Productos por acabarse${stock.datos?.length ? ` (${stock.datos.length})` : ''}`} className={stock.datos?.length ? 'tarjeta-aviso' : ''}>
        {stock.datos?.length ? (
          <ul className="lista">
            {stock.datos.map((p) => (
              <li key={p.id}>
                <span>{p.nombre}</span>
                <span className="etiqueta etiqueta-aviso">Quedan {p.cantidad} · mínimo {p.stock_minimo}</span>
              </li>
            ))}
          </ul>
        ) : <Vacio>Todo bien: ningún producto está por debajo de su mínimo.</Vacio>}
      </Tarjeta>

      <Tarjeta titulo={`Cobros pendientes${cobros.datos?.length ? ` (${cobros.datos.length})` : ''}`} className={cobros.datos?.length ? 'tarjeta-aviso' : ''}>
        {cobros.datos?.length ? (
          <ul className="lista">
            {cobros.datos.map((c) => (
              <li key={c.deuda_id}>
                <span><strong>{c.cliente}</strong><br /><small>{textoVencimiento(c)}</small></span>
                <span className={`etiqueta ${c.estado === 'vencida' ? 'etiqueta-peligro' : 'etiqueta-aviso'}`}>{pesos(c.saldo)}</span>
              </li>
            ))}
          </ul>
        ) : <Vacio>No hay cobros próximos a vencer.</Vacio>}
      </Tarjeta>
    </>
  );
}

export function textoVencimiento(c) {
  if (c.estado === 'vencida') return `Venció hace ${-c.dias_restantes} día(s) · ${soloFecha(c.fecha_pago_esperada)}`;
  if (c.estado === 'vence_hoy') return 'Vence hoy';
  return `Vence en ${c.dias_restantes} día(s) · ${soloFecha(c.fecha_pago_esperada)}`;
}
