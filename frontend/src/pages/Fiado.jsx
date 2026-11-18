import { useState } from 'react';
import { ArrowLeft, BookUser, ChevronRight, Clock, Plus } from 'lucide-react';
import { api, fechaHora, pesos, soloFecha } from '../services/api.js';
import { useSesion } from '../services/sesion.jsx';
import { Campo, Cargando, EncabezadoPagina, Mensaje, Seccion, Vacio, useAvisar, useDatos } from '../components/ui.jsx';
import { textoVencimiento } from './Inicio.jsx';

/** HU-06 (clientes, deudas y pagos) y HU-07 (alertas de cobro y días de aviso). */
export default function Fiado() {
  const clientes = useDatos(() => api.get('/clientes'));
  const alertas = useDatos(() => api.get('/fiados/alertas'));
  const [elegido, setElegido] = useState(null);
  const [nuevo, setNuevo] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const avisar = useAvisar();

  const total = clientes.datos?.reduce((s, c) => s + Number(c.saldo_pendiente), 0) || 0;

  async function guardarCliente(e) {
    e.preventDefault();
    setErrores({});
    setError('');
    try {
      await api.post('/clientes', nuevo);
      avisar('Cliente agregado');
      setNuevo(null);
      clientes.recargar();
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  if (elegido) {
    return <DetalleCliente cliente={elegido} onVolver={() => { setElegido(null); clientes.recargar(); alertas.recargar(); }} />;
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Fiado"
        subtitulo={clientes.datos ? `Le deben en total ${pesos(total)}` : undefined}
        accion={!nuevo && <button type="button" className="boton" onClick={() => setNuevo({ nombre: '', telefono: '' })}><Plus size={18} />Nuevo cliente</button>}
      />

      {nuevo && (
        <Seccion titulo="Nuevo cliente">
          <form onSubmit={guardarCliente} noValidate className="formulario">
            <Mensaje>{error}</Mensaje>
            <div className="fila-campos">
              <Campo etiqueta="Nombre" error={errores.nombre}>
                <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoFocus />
              </Campo>
              <Campo etiqueta="Celular (opcional)" error={errores.telefono}>
                <input type="tel" inputMode="tel" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
              </Campo>
            </div>
            <div className="acciones">
              <button className="boton">Guardar</button>
              <button type="button" className="boton boton-secundario" onClick={() => setNuevo(null)}>Cancelar</button>
            </div>
          </form>
        </Seccion>
      )}

      <div className="dos-columnas ancha-izquierda">
        <Seccion titulo="Clientes">
          <Mensaje>{clientes.error}</Mensaje>
          {clientes.cargando && !clientes.datos ? <Cargando /> : clientes.datos?.length ? (
            <ul className="lista lista-tocable">
              {clientes.datos.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setElegido(c)}>
                    <span className="lista-texto">
                      <strong>{c.nombre}</strong>
                      {c.telefono && <small>{c.telefono}</small>}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`etiqueta ${c.saldo_pendiente > 0 ? 'etiqueta-aviso' : 'etiqueta-ok'}`}>
                        {c.saldo_pendiente > 0 ? pesos(c.saldo_pendiente) : 'Al día'}
                      </span>
                      <ChevronRight size={18} className="chevron" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <Vacio icono={BookUser}>Aún no tiene clientes de fiado.</Vacio>}
        </Seccion>

        <div style={{ display: 'grid', gap: 20 }}>
          <Seccion titulo="Cobros próximos">
            {alertas.datos?.length ? (
              <ul className="lista">
                {alertas.datos.map((a) => (
                  <li key={a.deuda_id} className="alerta-fila">
                    <span className={`alerta-icono${a.estado === 'vencida' ? ' peligro' : ''}`} aria-hidden="true"><Clock size={18} /></span>
                    <span className="lista-texto"><strong>{a.cliente}</strong><small>{textoVencimiento(a)}</small></span>
                    <span className="valor">{pesos(a.saldo)}</span>
                  </li>
                ))}
              </ul>
            ) : <Vacio icono={Clock}>No hay cobros próximos.</Vacio>}
          </Seccion>
          <ConfigAviso onCambio={alertas.recargar} />
        </div>
      </div>
    </>
  );
}

/** HU-07 CA-1: configurar con cuántos días de anticipación se avisa. */
function ConfigAviso({ onCambio }) {
  const { usuario, recargar } = useSesion();
  const [dias, setDias] = useState(usuario.dias_aviso_cobro);
  const [error, setError] = useState('');
  const avisar = useAvisar();
  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.put('/auth/configuracion', { dias_aviso_cobro: Number(dias) });
      avisar('Aviso de cobro actualizado');
      await recargar();
      onCambio();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Seccion titulo="Aviso de cobro">
      <form onSubmit={guardar} className="fila-campos fila-alineada">
        <Campo etiqueta="Días de anticipación" error={error}>
          <input type="number" inputMode="numeric" min="0" max="60" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Campo>
        <button className="boton boton-secundario">Guardar</button>
      </form>
    </Seccion>
  );
}

/** HU-06 CA-3/CA-4: deudas de un cliente y registro de pagos. */
function DetalleCliente({ cliente, onVolver }) {
  const deudas = useDatos(() => api.get(`/fiados?cliente_id=${cliente.id}`), [cliente.id]);
  const [pagando, setPagando] = useState(null); // {id, valor}
  const [error, setError] = useState('');
  const avisar = useAvisar();
  const pendiente = deudas.datos?.filter((d) => !d.pagada).reduce((s, d) => s + Number(d.saldo), 0) || 0;

  async function pagar(e) {
    e.preventDefault();
    setError('');
    try {
      const r = await api.post(`/fiados/${pagando.id}/abonos`, { valor: Number(pagando.valor) });
      avisar(r.pagada ? 'Cuenta saldada' : `Pago registrado. Queda debiendo ${pesos(r.saldo)}`);
      setPagando(null);
      deudas.recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button type="button" className="boton-texto volver" onClick={onVolver}><ArrowLeft size={18} />Clientes</button>
      <EncabezadoPagina titulo={cliente.nombre} subtitulo={`Debe ${pesos(pendiente)}${cliente.telefono ? ` · ${cliente.telefono}` : ''}`} />
      <Seccion titulo="Cuentas">
        <Mensaje>{deudas.error}</Mensaje>
        {deudas.cargando && !deudas.datos ? <Cargando /> : deudas.datos?.length ? (
          <ul className="lista">
            {deudas.datos.map((d) => (
              <li key={d.id} className="deuda">
                <div className="deuda-fila">
                  <span className="lista-texto">
                    <strong>{pesos(d.valor)} fiado el {fechaHora(d.fecha_venta)}</strong>
                    <small>{d.pagada ? 'Pagada' : `Pendiente ${pesos(d.saldo)} · pagar a más tardar el ${soloFecha(d.fecha_pago_esperada)}`}</small>
                  </span>
                  {d.pagada
                    ? <span className="etiqueta etiqueta-ok">Pagada</span>
                    : pagando?.id !== d.id && <button type="button" className="boton boton-secundario" onClick={() => { setError(''); setPagando({ id: d.id, valor: d.saldo }); }}>Registrar pago</button>}
                </div>
                {pagando?.id === d.id && (
                  <form onSubmit={pagar} className="fila-campos fila-alineada">
                    <Campo etiqueta="¿Cuánto pagó?" error={error}>
                      <input type="number" inputMode="decimal" min="0" max={d.saldo} value={pagando.valor} onChange={(e) => setPagando({ ...pagando, valor: e.target.value })} autoFocus />
                    </Campo>
                    <div className="acciones">
                      <button className="boton">Confirmar pago</button>
                      <button type="button" className="boton boton-secundario" onClick={() => setPagando(null)}>Cancelar</button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : <Vacio icono={BookUser}>Este cliente no tiene cuentas. Para fiarle, use la pantalla Vender.</Vacio>}
      </Seccion>
    </>
  );
}
