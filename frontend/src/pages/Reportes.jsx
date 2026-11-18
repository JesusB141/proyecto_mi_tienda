import { useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { api, hoy, pesos, soloFecha } from '../services/api.js';
import { Cargando, Cifra, EncabezadoPagina, Mensaje, Seccion, Vacio, useDatos } from '../components/ui.jsx';

const PERIODOS = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']];

/** HU-08: ingresos, gastos y utilidad estimada por periodo. */
export default function Reportes() {
  const [periodo, setPeriodo] = useState('dia');
  const [fecha, setFecha] = useState(hoy());
  const r = useDatos(() => api.get(`/reportes?periodo=${periodo}&fecha=${fecha}`), [periodo, fecha]);
  const d = r.datos;
  const maxGasto = Math.max(1, ...(d?.gastos_por_concepto.map((g) => g.total) || []));
  const sinMovimientos = d && d.ingresos === 0 && d.egresos === 0;

  return (
    <>
      <EncabezadoPagina titulo="Reportes" subtitulo={d ? `Del ${soloFecha(d.desde)} al ${soloFecha(d.hasta)}` : undefined} />
      <div className="fila-campos fila-alineada">
        <div className="segmentos" role="radiogroup" aria-label="Periodo">
          {PERIODOS.map(([v, t]) => (
            <label key={v} className={periodo === v ? 'activo' : ''}>
              <input type="radio" name="periodo" value={v} checked={periodo === v} onChange={() => setPeriodo(v)} />{t}
            </label>
          ))}
        </div>
        <label className="campo">
          <span className="campo-etiqueta">Fecha</span>
          <input type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} />
        </label>
      </div>

      <Mensaje>{r.error}</Mensaje>
      {r.cargando && !d ? <Cargando /> : d && (
        <>
          <Seccion titulo="Resultado del periodo">
            <div className="cifras">
              <Cifra etiqueta="Ingresos" valor={pesos(d.ingresos)} tono="positivo" />
              <Cifra etiqueta="Gastos" valor={pesos(d.egresos)} tono="negativo" />
              <Cifra etiqueta="Utilidad" valor={pesos(d.utilidad)} tono={d.utilidad >= 0 ? 'positivo' : 'negativo'} />
            </div>
            <p className={`veredicto ${sinMovimientos ? 'neutro' : d.utilidad >= 0 ? 'bien' : 'mal'}`}>
              {!sinMovimientos && (d.utilidad >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />)}
              {sinMovimientos
                ? 'No hay movimientos en este periodo.'
                : d.utilidad >= 0 ? `Le quedaron ${pesos(d.utilidad)} en este periodo.` : `Salió más plata de la que entró: ${pesos(-d.utilidad)}.`}
            </p>
            <p className="nota">Los ingresos incluyen ventas de contado y pagos de fiado. Una venta fiada cuenta cuando el cliente paga.</p>
          </Seccion>

          <div className="dos-columnas">
            <Seccion titulo="Ventas">
              <div className="cifras">
                <Cifra etiqueta="Ventas" valor={d.ventas.cantidad} />
                <Cifra etiqueta="Vendido" valor={pesos(d.ventas.total)} />
                <Cifra etiqueta="Fiado" valor={pesos(d.ventas.fiado)} />
              </div>
            </Seccion>
            <Seccion titulo="¿En qué se fue la plata?">
              {d.gastos_por_concepto.length ? (
                <ul className="barras">
                  {d.gastos_por_concepto.map((g) => (
                    <li key={g.concepto}>
                      <div className="barras-texto"><span>{g.concepto}</span><strong className="num">{pesos(g.total)}</strong></div>
                      <div className="barras-pista"><div className="barras-relleno" style={{ width: `${(g.total / maxGasto) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <Vacio icono={BarChart3}>No hay gastos en este periodo.</Vacio>}
            </Seccion>
          </div>
        </>
      )}
    </>
  );
}
