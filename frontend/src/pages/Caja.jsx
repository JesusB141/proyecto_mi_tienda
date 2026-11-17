import { useState } from 'react';
import { api, fechaHora, hoy, pesos } from '../services/api.js';
import { Campo, Cargando, Cifra, Mensaje, Tarjeta, Vacio, useAviso, useDatos } from '../components/ui.jsx';

const ORIGEN = { VENTA: 'Venta', ABONO: 'Pago de fiado', COMPRA: 'Compra', MANUAL: 'Anotado a mano' };

/** HU-05: ingresos y gastos diarios, con el saldo del día. */
export default function Caja() {
  const [fecha, setFecha] = useState(hoy());
  const caja = useDatos(() => api.get(`/caja?fecha=${fecha}`), [fecha]);
  const [form, setForm] = useState({ tipo: 'EGRESO', concepto: '', valor: '', fecha: hoy() });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrores({});
    setError('');
    try {
      await api.post('/caja', form);
      setAviso(form.tipo === 'EGRESO' ? 'Gasto anotado' : 'Ingreso anotado');
      setForm({ ...form, concepto: '', valor: '' });
      if (form.fecha === fecha) caja.recargar(); else setFecha(form.fecha);
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  return (
    <>
      <h1 className="titulo">Caja</h1>
      <Mensaje tipo="exito">{aviso}</Mensaje>
      <div className="dos-columnas">
        <Tarjeta titulo="Anotar ingreso o gasto">
          <form onSubmit={guardar} noValidate className="formulario">
            <Mensaje tipo="error">{error}</Mensaje>
            <div className="selector-tipo" role="radiogroup" aria-label="Tipo de movimiento">
              {[['EGRESO', 'Gasto (sale plata)'], ['INGRESO', 'Ingreso (entra plata)']].map(([v, t]) => (
                <label key={v} className={form.tipo === v ? `activo tipo-${v.toLowerCase()}` : ''}>
                  <input type="radio" name="tipo" value={v} checked={form.tipo === v} onChange={cambiar} />{t}
                </label>
              ))}
            </div>
            <Campo etiqueta="¿Por qué?" error={errores.concepto} ayuda="Ejemplo: pago de la luz, arriendo, transporte">
              <input name="concepto" value={form.concepto} onChange={cambiar} />
            </Campo>
            <div className="fila-campos">
              <Campo etiqueta="Valor ($)" error={errores.valor}>
                <input name="valor" type="number" inputMode="decimal" min="0" value={form.valor} onChange={cambiar} />
              </Campo>
              <Campo etiqueta="Fecha" error={errores.fecha}>
                <input name="fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar} />
              </Campo>
            </div>
            <button className="boton boton-grande">Guardar</button>
          </form>
        </Tarjeta>

        <Tarjeta titulo="Movimientos del día" accion={<input type="date" aria-label="Día" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} />}>
          <Mensaje tipo="error">{caja.error}</Mensaje>
          <div className="cifras">
            <Cifra etiqueta="Entró" valor={pesos(caja.datos?.ingresos)} tono="positivo" />
            <Cifra etiqueta="Salió" valor={pesos(caja.datos?.egresos)} tono="negativo" />
            <Cifra etiqueta="Saldo del día" valor={pesos(caja.datos?.saldo)} />
          </div>
          {caja.cargando && !caja.datos ? <Cargando /> : caja.datos?.movimientos.length ? (
            <ul className="lista">
              {caja.datos.movimientos.map((m) => (
                <li key={m.id}>
                  <span>{m.concepto}<br /><small>{ORIGEN[m.origen]} · {fechaHora(m.fecha)}</small></span>
                  <span className={m.tipo === 'INGRESO' ? 'valor-positivo' : 'valor-negativo'}>
                    {m.tipo === 'INGRESO' ? '+' : '−'}{pesos(m.valor)}
                  </span>
                </li>
              ))}
            </ul>
          ) : <Vacio>No hay movimientos este día.</Vacio>}
        </Tarjeta>
      </div>
    </>
  );
}
