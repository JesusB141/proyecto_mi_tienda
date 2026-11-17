import { useState } from 'react';
import { api, pesos } from '../services/api.js';
import { Mensaje, Tarjeta, useAviso, useDatos } from '../components/ui.jsx';
import { ListaCarrito, SelectorProductos, totalCarrito, useCarrito } from '../components/Carrito.jsx';

/** HU-03: compra de mercancía que suma existencias y (opcional) se anota como gasto en caja. */
export default function Comprar() {
  const productos = useDatos(() => api.get('/productos'));
  const carrito = useCarrito();
  const [enCaja, setEnCaja] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();
  const [enviando, setEnviando] = useState(false);
  const total = totalCarrito(carrito.items, 'compra');

  async function confirmar() {
    setError('');
    setEnviando(true);
    try {
      const r = await api.post('/compras', {
        items: carrito.items.map((x) => ({ producto_id: x.producto.id, cantidad: x.cantidad, costo_unitario: Number(x.costo) })),
        registrar_en_caja: enCaja,
      });
      setAviso(`Compra registrada por ${pesos(r.total)}. Las existencias aumentaron.`);
      carrito.vaciar();
      productos.recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 className="titulo">Registrar compra de mercancía</h1>
      <Mensaje tipo="exito">{aviso}</Mensaje>
      <div className="dos-columnas">
        <Tarjeta titulo="1. ¿Qué llegó?">
          <Mensaje tipo="error">{productos.error}</Mensaje>
          <SelectorProductos productos={productos.datos} onElegir={carrito.agregar} modo="compra" />
        </Tarjeta>
        <Tarjeta titulo="2. Cantidades y costos" className="tarjeta-fija">
          <ListaCarrito carrito={carrito} modo="compra" />
          <div className="total"><span>Total de la compra</span><strong>{pesos(total)}</strong></div>
          <label className="interruptor">
            <input type="checkbox" checked={enCaja} onChange={(e) => setEnCaja(e.target.checked)} />
            <span>Pagué con dinero de la caja (anotar como gasto)</span>
          </label>
          <Mensaje tipo="error" onCerrar={() => setError('')}>{error}</Mensaje>
          <button type="button" className="boton boton-grande" disabled={!carrito.items.length || enviando} onClick={confirmar}>
            {enviando ? 'Registrando…' : 'Guardar compra'}
          </button>
        </Tarjeta>
      </div>
    </>
  );
}
