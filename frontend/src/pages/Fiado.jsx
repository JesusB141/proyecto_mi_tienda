import { useState } from 'react';
import { api, fechaHora, pesos, soloFecha } from '../services/api.js';
import { useSesion } from '../services/sesion.jsx';
import { Campo, Cargando, Mensaje, Tarjeta, Vacio, useAviso, useDatos } from '../components/ui.jsx';
import { textoVencimiento } from './Inicio.jsx';

/** HU-06 (clientes, deudas y pagos) y HU-07 (alertas de cobro y días de aviso). */
export default function Fiado() {
  const clientes = useDatos(() => api.get('/clientes'));
  const alertas = useDatos(() => api.get('/fiados/alertas'));
  const [elegido, setElegido] = useState(null);
  const [nuevo, setNuevo] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();

  const recargarTodo = () => { clientes.recargar(); alertas.recargar(); };

  async function guardarCliente(e) {
    e.preventDefault();
    setErrores({});
    setError('');
    try {
      await api.post('/clientes', nuevo);
      setAviso('Cliente agregado');
      setNuevo(null);
      clientes.recargar();
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  if (elegido) {
    return <DetalleCliente cliente={elegido} onVolver={() => { setElegido(null); recargarTodo(); }} />;
  }

  return (
    <>
      <div className="titulo-con-accion">
        <h1 className="titulo">Fiado</h1>
        {!nuevo && <button type="button" className="boton" onClick={() => setNuevo({ nombre: '', telefono: '' })}>+ Nuevo cliente</button>}
      </div>
      <Mensaje tipo="exito">{aviso}</Mensaje>

      {nuevo && (
        <Tarjeta titulo="Nuevo cliente">
          <form onSubmit={guardarCliente} noValidate className="formulario">
            <Mensaje tipo="error">{error}</Mensaje>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoFocus />
            </Campo>
            <Campo etiqueta="Celular (opcional)" error={errores.telefono}>
              <input type="tel" inputMode="tel" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
            </Campo>
            <div className="acciones">
              <button className="boton">Guardar</button>
              <button type="button" className="boton boton-secundario" onClick={() => setNuevo(null)}>Cancelar</button>
            </div>
          </form>
        </Tarjeta>
      )}

      <div className="dos-columnas">
        <Tarjeta titulo="Clientes">
          <Mensaje tipo="error">{clientes.error}</Mensaje>
          {clientes.cargando && !clientes.datos ? <Cargando /> : clientes.datos?.length ? (
            <ul className="lista lista-tocable">
              {clientes.datos.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setElegido(c)}>
                    <span><strong>{c.nombre}</strong>{c.telefono && <><br /><small>{c.telefono}</small></>}</span>
                    <span className={`etiqueta ${c.saldo_pendiente > 0 ? 'etiqueta-aviso' : 'etiqueta-ok'}`}>
                      {c.saldo_pendiente > 0 ? `Debe ${pesos(c.saldo_pendiente)}` : 'Al día'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <Vacio>Aún no tiene clientes de fiado.</Vacio>}
        </Tarjeta>

        <div>
          <Tarjeta titulo="Cobros próximos" className={alertas.datos?.length ? 'tarjeta-aviso' : ''}>
            {alertas.datos?.length ? (
              <ul className="lista">
                {alertas.datos.map((a) => (
                  <li key={a.deuda_id}>
                    <span><strong>{a.cliente}</strong><br /><small>{textoVencimiento(a)}</small></span>
                    <span className={`etiqueta ${a.estado === 'vencida' ? 'etiqueta-peligro' : 'etiqueta-aviso'}`}>{pesos(a.saldo)}</span>
                  </li>
                ))}
              </ul>
            ) : <Vacio>No hay cobros próximos.</Vacio>}
          </Tarjeta>
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
  const [msg, setMsg] = useAviso();
  const [error, setError] = useState('');
  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.put('/auth/configuracion', { dias_aviso_cobro: Number(dias) });
      setMsg('Guardado');
      await recargar();
      onCambio();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Tarjeta titulo="Avisos de cobro">
      <form onSubmit={guardar} className="fila-campos fila-alineada">
        <Campo etiqueta="Avisarme con estos días de anticipación" error={error}>
          <input type="number" inputMode="numeric" min="0" max="60" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Campo>
        <button className="boton boton-secundario">Guardar</button>
      </form>
      <Mensaje tipo="exito">{msg}</Mensaje>
    </Tarjeta>
  );
}

/** HU-06 CA-3/CA-4: deudas de un cliente y registro de pagos. */
function DetalleCliente({ cliente, onVolver }) {
  const deudas = useDatos(() => api.get(`/fiados?cliente_id=${cliente.id}`), [cliente.id]);
  const [pagando, setPagando] = useState(null); // {id, valor}
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();
  const pendiente = deudas.datos?.filter((d) => !d.pagada).reduce((s, d) => s + d.saldo, 0) || 0;

  async function pagar(e) {
    e.preventDefault();
    setError('');
    try {
      const r = await api.post(`/fiados/${pagando.id}/abonos`, { valor: Number(pagando.valor) });
      setAviso(r.pagada ? 'Cuenta saldada. El pago se anotó en la caja.' : `Pago registrado. Queda debiendo ${pesos(r.saldo)}.`);
      setPagando(null);
      deudas.recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button type="button" className="boton-texto volver" onClick={onVolver}>← Volver a clientes</button>
      <h1 className="titulo">{cliente.nombre}</h1>
      <p className="subtitulo">Debe en total: <strong>{pesos(pendiente)}</strong></p>
      <Mensaje tipo="exito">{aviso}</Mensaje>
      <Tarjeta titulo="Cuentas">
        <Mensaje tipo="error">{deudas.error}</Mensaje>
        {deudas.cargando && !deudas.datos ? <Cargando /> : deudas.datos?.length ? (
          <ul className="lista">
            {deudas.datos.map((d) => (
              <li key={d.id} className="deuda">
                <div className="deuda-fila">
                  <span>
                    <strong>{pesos(d.valor)}</strong> · fiado el {fechaHora(d.fecha_venta)}<br />
                    <small>{d.pagada ? 'Pagada' : `Pagar a más tardar el ${soloFecha(d.fecha_pago_esperada)}`}</small>
                  </span>
                  {d.pagada
                    ? <span className="etiqueta etiqueta-ok">Pagada</span>
                    : <button type="button" className="boton" onClick={() => { setError(''); setPagando({ id: d.id, valor: d.saldo }); }}>Registrar pago</button>}
                </div>
                {!d.pagada && <small>Saldo pendiente: <strong>{pesos(d.saldo)}</strong></small>}
                {pagando?.id === d.id && (
                  <form onSubmit={pagar} className="fila-campos fila-alineada">
                    <Campo etiqueta="¿Cuánto pagó? ($)" error={error}>
                      <input type="number" inputMode="decimal" min="0" max={d.saldo} value={pagando.valor} onChange={(e) => setPagando({ ...pagando, valor: e.target.value })} autoFocus />
                    </Campo>
                    <div className="acciones">
                      <button className="boton">Confirmar</button>
                      <button type="button" className="boton boton-secundario" onClick={() => setPagando(null)}>Cancelar</button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : <Vacio>Este cliente no tiene cuentas. Para fiarle, use la pantalla Vender.</Vacio>}
      </Tarjeta>
    </>
  );
}
