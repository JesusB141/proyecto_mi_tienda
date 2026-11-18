import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, hoy, pesos } from '../services/api.js';
import { Campo, EncabezadoPagina, Mensaje, Seccion, useAvisar, useDatos } from '../components/ui.jsx';
import { BarraCobro, ListaCarrito, PanelCuenta, SelectorProductos, totalCarrito, useCarrito } from '../components/Carrito.jsx';

/** HU-03 (venta con descuento de existencias) y HU-06 (venta a crédito / fiado). */
export default function Vender() {
  const productos = useDatos(() => api.get('/productos'));
  const clientes = useDatos(() => api.get('/clientes'));
  const carrito = useCarrito();
  const avisar = useAvisar();
  const [hoja, setHoja] = useState(false);
  const [fiado, setFiado] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const total = totalCarrito(carrito.items, 'venta');

  async function confirmar() {
    setError('');
    if (fiado && !clienteId) return setError('Elija el cliente al que le va a fiar');
    if (fiado && !fechaPago) return setError('Elija la fecha en que el cliente va a pagar');
    setEnviando(true);
    try {
      const r = await api.post('/ventas', {
        items: carrito.items.map((x) => ({ producto_id: x.producto.id, cantidad: x.cantidad })),
        credito: fiado ? { cliente_id: Number(clienteId), fecha_pago_esperada: fechaPago } : undefined,
      });
      avisar(r.credito ? `Fiado registrado por ${pesos(r.total)}` : `Venta registrada por ${pesos(r.total)}`);
      carrito.vaciar();
      setFiado(false);
      setClienteId('');
      setFechaPago('');
      setHoja(false);
      productos.recargar();
    } catch (err) {
      setError(err.message); // HU-03 CA-3: advertencia por existencias insuficientes
    } finally {
      setEnviando(false);
    }
  }

  const cuenta = (
    <>
      <ListaCarrito carrito={carrito} modo="venta" />
      {carrito.items.length > 0 && (
        <>
          <div className="total-fila"><span>Total</span><strong>{pesos(total)}</strong></div>
          <label className="interruptor">
            <span>Es fiado</span>
            <input type="checkbox" checked={fiado} onChange={(e) => setFiado(e.target.checked)} />
          </label>
          {fiado && (
            <div className="formulario">
              <Campo etiqueta="Cliente" ayuda={!clientes.datos?.length ? 'Primero agregue clientes en Fiado' : undefined}>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Elija un cliente</option>
                  {clientes.datos?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Campo>
              {!clientes.datos?.length && <Link to="/fiado">Agregar cliente</Link>}
              <Campo etiqueta="¿Cuándo va a pagar?">
                <input type="date" min={hoy()} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
              </Campo>
            </div>
          )}
          <Mensaje onCerrar={() => setError('')}>{error}</Mensaje>
          <button type="button" className="boton boton-bloque" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Registrando…' : fiado ? `Fiar ${pesos(total)}` : `Cobrar ${pesos(total)}`}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className={carrito.unidades ? 'con-barra-cobro' : ''} style={{ display: 'grid', gap: 20 }}>
      <EncabezadoPagina titulo="Vender" subtitulo="Toque los productos que lleva el cliente." />
      <div className="dos-columnas ancha-izquierda">
        <Seccion>
          <Mensaje>{productos.error}</Mensaje>
          <SelectorProductos productos={productos.datos} carrito={carrito} modo="venta" />
        </Seccion>
        <PanelCuenta titulo="Cuenta" abierto={hoja} onCerrar={() => setHoja(false)}>{cuenta}</PanelCuenta>
      </div>
      {!hoja && <BarraCobro unidades={carrito.unidades} total={total} onAbrir={() => setHoja(true)} etiqueta="Revisar y cobrar" />}
    </div>
  );
}
