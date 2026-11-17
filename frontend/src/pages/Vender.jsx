import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, hoy, pesos } from '../services/api.js';
import { Campo, Mensaje, Tarjeta, useAviso, useDatos } from '../components/ui.jsx';
import { ListaCarrito, SelectorProductos, totalCarrito, useCarrito } from '../components/Carrito.jsx';

/** HU-03 (venta con descuento de existencias) y HU-06 (venta a crédito / fiado). */
export default function Vender() {
  const productos = useDatos(() => api.get('/productos'));
  const clientes = useDatos(() => api.get('/clientes'));
  const carrito = useCarrito();
  const [fiado, setFiado] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();
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
      setAviso(`Venta registrada por ${pesos(r.total)}${r.credito ? ' (fiado)' : ''}. El inventario se actualizó.`);
      carrito.vaciar();
      setFiado(false);
      setClienteId('');
      setFechaPago('');
      productos.recargar();
    } catch (err) {
      setError(err.message); // HU-03 CA-3: advertencia por existencias insuficientes
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 className="titulo">Vender</h1>
      <Mensaje tipo="exito">{aviso}</Mensaje>
      <div className="dos-columnas">
        <Tarjeta titulo="1. Elija los productos">
          <Mensaje tipo="error">{productos.error}</Mensaje>
          <SelectorProductos productos={productos.datos} onElegir={carrito.agregar} modo="venta" />
        </Tarjeta>

        <Tarjeta titulo="2. Revise y confirme" className="tarjeta-fija">
          <ListaCarrito carrito={carrito} modo="venta" />
          <div className="total"><span>Total</span><strong>{pesos(total)}</strong></div>

          <label className="interruptor">
            <input type="checkbox" checked={fiado} onChange={(e) => setFiado(e.target.checked)} />
            <span>Es fiado (venta a crédito)</span>
          </label>
          {fiado && (
            <div className="formulario">
              <Campo etiqueta="Cliente" ayuda={!clientes.datos?.length ? 'Primero agregue clientes en la sección Fiado' : undefined}>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Elija un cliente…</option>
                  {clientes.datos?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Campo>
              {!clientes.datos?.length && <Link to="/fiado">Agregar cliente</Link>}
              <Campo etiqueta="¿Cuándo va a pagar?">
                <input type="date" min={hoy()} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
              </Campo>
            </div>
          )}

          <Mensaje tipo="error" onCerrar={() => setError('')}>{error}</Mensaje>
          <button type="button" className="boton boton-grande" disabled={!carrito.items.length || enviando} onClick={confirmar}>
            {enviando ? 'Registrando…' : fiado ? `Fiar ${pesos(total)}` : `Cobrar ${pesos(total)}`}
          </button>
        </Tarjeta>
      </div>
    </>
  );
}
