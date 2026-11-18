import { useState } from 'react';
import { api, pesos } from '../services/api.js';
import { EncabezadoPagina, Mensaje, Seccion, useAvisar, useDatos } from '../components/ui.jsx';
import { BarraCobro, ListaCarrito, PanelCuenta, SelectorProductos, totalCarrito, useCarrito } from '../components/Carrito.jsx';

/** HU-03: compra de mercancía que suma existencias y (opcional) se anota como gasto en caja. */
export default function Comprar() {
  const productos = useDatos(() => api.get('/productos'));
  const carrito = useCarrito();
  const avisar = useAvisar();
  const [hoja, setHoja] = useState(false);
  const [enCaja, setEnCaja] = useState(true);
  const [error, setError] = useState('');
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
      avisar(`Compra registrada por ${pesos(r.total)}`);
      carrito.vaciar();
      setHoja(false);
      productos.recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const detalle = (
    <>
      <ListaCarrito carrito={carrito} modo="compra" />
      {carrito.items.length > 0 && (
        <>
          <div className="total-fila"><span>Total de la compra</span><strong>{pesos(total)}</strong></div>
          <label className="interruptor">
            <span>Pagué con plata de la caja</span>
            <input type="checkbox" checked={enCaja} onChange={(e) => setEnCaja(e.target.checked)} />
          </label>
          <Mensaje onCerrar={() => setError('')}>{error}</Mensaje>
          <button type="button" className="boton boton-bloque" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Registrando…' : 'Guardar compra'}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className={carrito.unidades ? 'con-barra-cobro' : ''} style={{ display: 'grid', gap: 20 }}>
      <EncabezadoPagina titulo="Registrar compra" subtitulo="Anote la mercancía que llegó; las existencias se suman solas." />
      <div className="dos-columnas ancha-izquierda">
        <Seccion>
          <Mensaje>{productos.error}</Mensaje>
          <SelectorProductos productos={productos.datos} carrito={carrito} modo="compra" />
        </Seccion>
        <PanelCuenta titulo="Lo que llegó" abierto={hoja} onCerrar={() => setHoja(false)}>{detalle}</PanelCuenta>
      </div>
      {!hoja && <BarraCobro unidades={carrito.unidades} total={total} onAbrir={() => setHoja(true)} etiqueta="Revisar compra" />}
    </div>
  );
}
