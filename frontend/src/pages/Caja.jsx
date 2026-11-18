import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { api, fechaHora, hoy, pesos } from '../services/api.js';
import { Campo, Cargando, Cifra, EncabezadoPagina, Mensaje, Seccion, Vacio, useAvisar, useDatos } from '../components/ui.jsx';

const ORIGEN = { VENTA: 'Venta', ABONO: 'Pago de fiado', COMPRA: 'Compra de mercancía', MANUAL: 'Anotado a mano' };

/** HU-05: ingresos y gastos diarios, con el saldo del día. */
export default function Caja() {
  const [fecha, setFecha] = useState(hoy());
  const caja = useDatos(() => api.get(`/caja?fecha=${fecha}`), [fecha]);
  const [form, setForm] = useState({ tipo: 'EGRESO', concepto: '', valor: '', fecha: hoy() });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const avisar = useAvisar();

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrores({});
    setError('');
    try {
      await api.post('/caja', form);
      avisar(form.tipo === 'EGRESO' ? 'Gasto anotado' : 'Ingreso anotado');
      setForm({ ...form, concepto: '', valor: '' });
      if (form.fecha === fecha) caja.recargar(); else setFecha(form.fecha);
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Caja" subtitulo="Lo que entra y sale de la tienda cada día." />
      <div className="dos-columnas">
        <Seccion titulo="Anotar ingreso o gasto">
          <form onSubmit={guardar} noValidate className="formulario">
            <Mensaje>{error}</Mensaje>
            <div className="segmentos" role="radiogroup" aria-label="Tipo de movimiento">
              {[['EGRESO', 'Gasto', 'gasto'], ['INGRESO', 'Ingreso', 'ingreso']].map(([v, t, c]) => (
                <label key={v} className={form.tipo === v ? `activo ${c}` : ''}>
                  <input type="radio" name="tipo" value={v} checked={form.tipo === v} onChange={cambiar} />{t}
                </label>
              ))}
            </div>
            <Campo etiqueta="Concepto" error={errores.concepto} ayuda="Ej.: pago de la luz, arriendo, transporte">
              <input name="concepto" value={form.concepto} onChange={cambiar} />
            </Campo>
            <div className="fila-campos">
              <Campo etiqueta="Valor" error={errores.valor}>
                <input name="valor" type="number" inputMode="decimal" min="0" value={form.valor} onChange={cambiar} placeholder="$" />
              </Campo>
              <Campo etiqueta="Fecha" error={errores.fecha}>
                <input name="fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar} />
              </Campo>
            </div>
            <button className="boton boton-bloque">{form.tipo === 'EGRESO' ? 'Anotar gasto' : 'Anotar ingreso'}</button>
          </form>
        </Seccion>

        <Seccion titulo="Movimientos" accion={<input type="date" aria-label="Día" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} />}>
          <Mensaje>{caja.error}</Mensaje>
          <div className="cifras">
            <Cifra etiqueta="Entró" valor={pesos(caja.datos?.ingresos)} tono="positivo" />
            <Cifra etiqueta="Salió" valor={pesos(caja.datos?.egresos)} tono="negativo" />
            <Cifra etiqueta="Saldo" valor={pesos(caja.datos?.saldo)} />
          </div>
          {caja.cargando && !caja.datos ? <Cargando /> : caja.datos?.movimientos.length ? (
            <ul className="lista">
              {caja.datos.movimientos.map((m) => {
                const entra = m.tipo === 'INGRESO';
                const Icono = entra ? ArrowDownLeft : ArrowUpRight;
                return (
                  <li key={m.id} className="alerta-fila">
                    <span className={`alerta-icono${entra ? '' : ' peligro'}`} style={entra ? { background: 'var(--primario-suave)', color: 'var(--primario)' } : undefined} aria-hidden="true"><Icono size={18} /></span>
                    <span className="lista-texto">
                      <strong>{m.concepto}</strong>
                      <small>{ORIGEN[m.origen]} · {fechaHora(m.fecha)}</small>
                    </span>
                    <span className={`valor ${entra ? 'valor-positivo' : 'valor-negativo'}`}>{entra ? '+' : '−'}{pesos(m.valor)}</span>
                  </li>
                );
              })}
            </ul>
          ) : <Vacio icono={Wallet}>No hay movimientos este día.</Vacio>}
        </Seccion>
      </div>
    </>
  );
}
