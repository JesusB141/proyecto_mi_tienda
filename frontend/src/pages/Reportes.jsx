import { useState } from 'react';
import { api, hoy, pesos, soloFecha } from '../services/api.js';
import { Cargando, Cifra, Mensaje, Tarjeta, Vacio, useDatos } from '../components/ui.jsx';

const PERIODOS = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']];

/** HU-08: ingresos, gastos y utilidad estimada por periodo. */
export default function Reportes() {
  const [periodo, setPeriodo] = useState('dia');
  const [fecha, setFecha] = useState(hoy());
  const r = useDatos(() => api.get(`/reportes?periodo=${periodo}&fecha=${fecha}`), [periodo, fecha]);
  const d = r.datos;
  const maxGasto = Math.max(1, ...(d?.gastos_por_concepto.map((g) => g.total) || []));

  return (
    <>
      <h1 className="titulo">Reportes</h1>
      <Tarjeta>
        <div className="selector-tipo" role="radiogroup" aria-label="Periodo">
          {PERIODOS.map(([v, t]) => (
            <label key={v} className={periodo === v ? 'activo' : ''}>
              <input type="radio" name="periodo" value={v} checked={periodo === v} onChange={() => setPeriodo(v)} />{t}
            </label>
          ))}
        </div>
        <label className="campo">
          <span className="campo-etiqueta">Fecha de referencia</span>
          <input type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} />
        </label>
        {d && <p className="subtitulo">Del {soloFecha(d.desde)} al {soloFecha(d.hasta)}</p>}
      </Tarjeta>

      <Mensaje tipo="error">{r.error}</Mensaje>
      {r.cargando && !d ? <Cargando /> : d && (
        <>
          <Tarjeta titulo="¿Mi negocio está ganando?">
            <div className="cifras">
              <Cifra etiqueta="Ingresos" valor={pesos(d.ingresos)} tono="positivo" />
              <Cifra etiqueta="Gastos" valor={pesos(d.egresos)} tono="negativo" />
              <Cifra etiqueta="Utilidad estimada" valor={pesos(d.utilidad)} tono={d.utilidad >= 0 ? 'positivo' : 'negativo'} />
            </div>
            <p className={`veredicto ${d.utilidad >= 0 ? 'valor-positivo' : 'valor-negativo'}`}>
              {d.ingresos === 0 && d.egresos === 0
                ? 'No hay movimientos en este periodo.'
                : d.utilidad >= 0 ? `En este periodo le quedaron ${pesos(d.utilidad)}.` : `En este periodo salió más plata de la que entró: ${pesos(-d.utilidad)}.`}
            </p>
            <small className="nota">Los ingresos incluyen ventas de contado y pagos de fiado. Las ventas fiadas cuentan cuando el cliente paga.</small>
          </Tarjeta>

          <div className="dos-columnas">
            <Tarjeta titulo="Ventas">
              <div className="cifras">
                <Cifra etiqueta="Número de ventas" valor={d.ventas.cantidad} />
                <Cifra etiqueta="Total vendido" valor={pesos(d.ventas.total)} />
                <Cifra etiqueta="De eso, fiado" valor={pesos(d.ventas.fiado)} />
              </div>
            </Tarjeta>
            <Tarjeta titulo="¿En qué se fue la plata?">
              {d.gastos_por_concepto.length ? (
                <ul className="barras">
                  {d.gastos_por_concepto.map((g) => (
                    <li key={g.concepto}>
                      <div className="barras-texto"><span>{g.concepto}</span><strong>{pesos(g.total)}</strong></div>
                      <div className="barras-pista"><div className="barras-relleno" style={{ width: `${(g.total / maxGasto) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <Vacio>No hay gastos en este periodo.</Vacio>}
            </Tarjeta>
          </div>
        </>
      )}
    </>
  );
}
