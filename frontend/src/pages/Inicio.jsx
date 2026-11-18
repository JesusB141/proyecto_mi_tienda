import { Link } from 'react-router-dom';
import { AlertTriangle, BookUser, ChevronRight, Clock, PackageCheck, Receipt, ShoppingCart, Truck } from 'lucide-react';
import { api, pesos, soloFecha } from '../services/api.js';
import { useSesion } from '../services/sesion.jsx';
import { Mensaje, Seccion, Vacio, useDatos } from '../components/ui.jsx';

const fHoy = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

/** Pantalla principal: caja del día y alertas de stock (HU-04) y de cobro (HU-07). */
export default function Inicio() {
  const { usuario } = useSesion();
  const caja = useDatos(() => api.get('/caja'));
  const stock = useDatos(() => api.get('/productos/alertas'));
  const cobros = useDatos(() => api.get('/fiados/alertas'));
  const hoy = fHoy.format(new Date());

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Resumen de hoy</h1>
          <p>{hoy.charAt(0).toUpperCase() + hoy.slice(1)} · {usuario.usuario}</p>
        </div>
        <Link to="/vender" className="boton solo-escritorio"><ShoppingCart size={18} />Nueva venta</Link>
      </div>

      <Seccion titulo="Caja de hoy" accion={<Link to="/caja">Ver movimientos</Link>}>
        <Mensaje>{caja.error}</Mensaje>
        <div className="resumen-hoy">
          <div className="saldo-grande">
            <span>Saldo del día</span>
            <strong className={caja.datos?.saldo < 0 ? 'valor-negativo' : ''}>{pesos(caja.datos?.saldo)}</strong>
          </div>
          <div className="saldo-detalle">
            <span>Entró <b className="valor-positivo">{pesos(caja.datos?.ingresos)}</b></span>
            <span>Salió <b className="valor-negativo">{pesos(caja.datos?.egresos)}</b></span>
          </div>
        </div>
      </Seccion>

      <nav className="atajos" aria-label="Accesos rápidos">
        <Link to="/comprar" className="atajo"><Truck size={22} />Registrar compra</Link>
        <Link to="/caja" className="atajo"><Receipt size={22} />Anotar gasto</Link>
        <Link to="/fiado" className="atajo"><BookUser size={22} />Fiado</Link>
      </nav>

      <div className="dos-columnas">
        <Seccion titulo="Por acabarse" accion={stock.datos?.length ? <span className="etiqueta etiqueta-aviso">{stock.datos.length}</span> : null}>
          {stock.datos?.length ? (
            <ul className="lista">
              {stock.datos.map((p) => (
                <li key={p.id} className="alerta-fila">
                  <span className="alerta-icono" aria-hidden="true"><AlertTriangle size={18} /></span>
                  <span className="lista-texto">
                    <strong>{p.nombre}</strong>
                    <small>Mínimo {p.stock_minimo} und.</small>
                  </span>
                  <span className="valor">Quedan {p.cantidad}</span>
                </li>
              ))}
            </ul>
          ) : <Vacio icono={PackageCheck}>Ningún producto está por debajo de su mínimo.</Vacio>}
          {stock.datos?.length > 0 && <Link to="/comprar" className="boton-texto">Registrar compra <ChevronRight size={16} /></Link>}
        </Seccion>

        <Seccion titulo="Cobros pendientes" accion={cobros.datos?.length ? <span className="etiqueta etiqueta-aviso">{cobros.datos.length}</span> : null}>
          {cobros.datos?.length ? (
            <ul className="lista">
              {cobros.datos.map((c) => (
                <li key={c.deuda_id} className="alerta-fila">
                  <span className={`alerta-icono${c.estado === 'vencida' ? ' peligro' : ''}`} aria-hidden="true"><Clock size={18} /></span>
                  <span className="lista-texto">
                    <strong>{c.cliente}</strong>
                    <small>{textoVencimiento(c)}</small>
                  </span>
                  <span className="valor">{pesos(c.saldo)}</span>
                </li>
              ))}
            </ul>
          ) : <Vacio icono={BookUser}>No hay cobros próximos a vencer.</Vacio>}
        </Seccion>
      </div>
    </>
  );
}

export function textoVencimiento(c) {
  if (c.estado === 'vencida') return `Venció hace ${-c.dias_restantes} día(s) · ${soloFecha(c.fecha_pago_esperada)}`;
  if (c.estado === 'vence_hoy') return 'Vence hoy';
  return `Vence en ${c.dias_restantes} día(s) · ${soloFecha(c.fecha_pago_esperada)}`;
}
