import { useState } from 'react';
import { api, fechaHora, hoy, pesos } from '../services/api.js';
import { Cargando, Mensaje, Tarjeta, Vacio, useDatos } from '../components/ui.jsx';

const hace30 = () => new Date(Date.now() - 5 * 3600 * 1000 - 30 * 86400000).toISOString().slice(0, 10);

const TIPOS = {
  inventario: [['', 'Todo'], ['VENTA', 'Ventas'], ['COMPRA', 'Compras']],
  caja: [['', 'Todo'], ['INGRESO', 'Ingresos'], ['EGRESO', 'Gastos']],
};

/** HU-09: historial de movimientos de inventario y de caja, con filtros de fecha y tipo. */
export default function Historial() {
  const [vista, setVista] = useState('inventario');
  const [desde, setDesde] = useState(hace30());
  const [hasta, setHasta] = useState(hoy());
  const [tipo, setTipo] = useState('');
  const h = useDatos(
    () => api.get(`/historial/${vista}?desde=${desde}&hasta=${hasta}&tipo=${tipo}`),
    [vista, desde, hasta, tipo],
  );

  return (
    <>
      <h1 className="titulo">Historial</h1>
      <div className="pestanas" role="tablist">
        {[['inventario', 'Inventario'], ['caja', 'Caja']].map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={vista === v} className={vista === v ? 'activa' : ''} onClick={() => { setVista(v); setTipo(''); }}>{t}</button>
        ))}
      </div>
      <Tarjeta>
        <div className="fila-campos">
          <label className="campo"><span className="campo-etiqueta">Desde</span>
            <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} /></label>
          <label className="campo"><span className="campo-etiqueta">Hasta</span>
            <input type="date" value={hasta} min={desde} max={hoy()} onChange={(e) => setHasta(e.target.value)} /></label>
          <label className="campo"><span className="campo-etiqueta">Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS[vista].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select></label>
        </div>
      </Tarjeta>
      <Tarjeta>
        <Mensaje tipo="error">{h.error}</Mensaje>
        {h.cargando && !h.datos ? <Cargando /> : h.datos?.length ? (
          <ul className="lista">
            {h.datos.map((m, i) => (
              <li key={i}>
                {vista === 'inventario' ? (
                  <>
                    <span><strong>{m.producto}</strong><br /><small>{m.tipo === 'VENTA' ? 'Venta' : 'Compra'} · {fechaHora(m.fecha)}</small></span>
                    <span className={m.tipo === 'VENTA' ? 'valor-negativo' : 'valor-positivo'}>
                      {m.tipo === 'VENTA' ? '−' : '+'}{m.cantidad} und. <small>a {pesos(m.valor_unitario)}</small>
                    </span>
                  </>
                ) : (
                  <>
                    <span>{m.concepto}<br /><small>{fechaHora(m.fecha)}</small></span>
                    <span className={m.tipo === 'INGRESO' ? 'valor-positivo' : 'valor-negativo'}>
                      {m.tipo === 'INGRESO' ? '+' : '−'}{pesos(m.valor)}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : <Vacio>No hay movimientos en ese rango de fechas.</Vacio>}
      </Tarjeta>
    </>
  );
}
