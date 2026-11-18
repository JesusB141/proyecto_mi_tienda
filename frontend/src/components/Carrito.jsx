import { useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingBasket } from 'lucide-react';
import { pesos } from '../services/api.js';
import { Vacio } from './ui.jsx';

/**
 * Carrito para ventas (HU-03, HU-06) y compras (HU-03).
 * modo = 'venta' usa el precio de venta; modo = 'compra' permite editar el costo.
 */
export function useCarrito() {
  const [items, setItems] = useState([]); // {producto, cantidad, costo}
  const agregar = (p) => setItems((xs) => {
    const i = xs.findIndex((x) => x.producto.id === p.id);
    if (i >= 0) return xs.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x));
    return [...xs, { producto: p, cantidad: 1, costo: p.precio_compra }];
  });
  const cambiar = (id, cambios) => setItems((xs) => xs.map((x) => (x.producto.id === id ? { ...x, ...cambios } : x)));
  const quitar = (id) => setItems((xs) => xs.filter((x) => x.producto.id !== id));
  const vaciar = () => setItems([]);
  const unidades = items.reduce((s, x) => s + x.cantidad, 0);
  return { items, agregar, cambiar, quitar, vaciar, unidades };
}

export function SelectorProductos({ productos, carrito, modo }) {
  const [buscar, setBuscar] = useState('');
  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (productos || []).filter((p) => !q || p.nombre.toLowerCase().includes(q));
  }, [productos, buscar]);
  const enCarrito = new Map(carrito.items.map((x) => [x.producto.id, x.cantidad]));

  return (
    <>
      <label className="buscador">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" />
      </label>
      {filtrados.length ? (
        <ul className="lista lista-tocable lista-desplazable">
          {filtrados.map((p) => {
            const agotado = modo === 'venta' && p.cantidad <= 0;
            const n = enCarrito.get(p.id);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => carrito.agregar(p)} disabled={agotado} aria-label={`Agregar ${p.nombre}`}>
                  <span className="lista-texto">
                    <strong>{p.nombre}</strong>
                    <small>
                      {modo === 'venta' ? pesos(p.precio_venta) : `Costo ${pesos(p.precio_compra)}`}
                      {' · '}{agotado ? 'Agotado' : `quedan ${p.cantidad}`}
                    </small>
                  </span>
                  {n ? <span className="en-carrito" aria-label={`${n} en la cuenta`}>{n}</span> : <span className="agregar" aria-hidden="true"><Plus size={20} /></span>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : <Vacio icono={Search}>{buscar ? 'No hay productos con ese nombre.' : 'Aún no hay productos en el inventario.'}</Vacio>}
    </>
  );
}

export function ListaCarrito({ carrito, modo }) {
  const { items, cambiar, quitar } = carrito;
  if (!items.length) return <Vacio icono={ShoppingBasket}>Toque un producto para agregarlo a la cuenta.</Vacio>;
  return (
    <ul className="carrito">
      {items.map(({ producto: p, cantidad, costo }) => {
        const precio = modo === 'venta' ? p.precio_venta : Number(costo) || 0;
        const excede = modo === 'venta' && cantidad > p.cantidad;
        return (
          <li key={p.id} className={excede ? 'con-error' : ''}>
            <span className="carrito-nombre">
              <strong>{p.nombre}</strong>
              <small>{excede ? `Solo quedan ${p.cantidad}` : `${pesos(precio)} c/u`}</small>
            </span>
            <span className="carrito-subtotal">{pesos(precio * cantidad)}</span>
            <div className="carrito-controles">
              <div className="contador">
                <button type="button" aria-label={cantidad > 1 ? 'Quitar uno' : `Quitar ${p.nombre}`} onClick={() => (cantidad > 1 ? cambiar(p.id, { cantidad: cantidad - 1 }) : quitar(p.id))}><Minus size={18} /></button>
                <input
                  type="number" inputMode="numeric" min="1" aria-label={`Cantidad de ${p.nombre}`}
                  value={cantidad} onChange={(e) => cambiar(p.id, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
                <button type="button" aria-label="Agregar uno" onClick={() => cambiar(p.id, { cantidad: cantidad + 1 })}><Plus size={18} /></button>
              </div>
              {modo === 'compra' && (
                <label className="costo-unitario">
                  Costo c/u
                  <input type="number" inputMode="decimal" min="0" value={costo} onChange={(e) => cambiar(p.id, { costo: e.target.value })} />
                </label>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function totalCarrito(items, modo) {
  return items.reduce((s, x) => s + (modo === 'venta' ? x.producto.precio_venta : Number(x.costo) || 0) * x.cantidad, 0);
}

/** Panel de revisión: en computador es una columna fija; en celular, una hoja que sube desde abajo. */
export function PanelCuenta({ abierto, onCerrar, titulo, children }) {
  return (
    <>
      <section className="seccion fija solo-escritorio" aria-label={titulo}>
        <header className="seccion-cabecera"><h2>{titulo}</h2></header>
        {children}
      </section>
      {abierto && (
        <div className="hoja-fondo solo-celular" onClick={onCerrar}>
          <div className="hoja" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabecera">
              <strong>{titulo}</strong>
              <button type="button" className="boton-texto" onClick={onCerrar}>Seguir agregando</button>
            </div>
            <div className="formulario">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

export function BarraCobro({ unidades, total, onAbrir, etiqueta = 'Revisar' }) {
  if (!unidades) return null;
  return (
    <div className="barra-cobro">
      <div>
        <small>{unidades} producto{unidades === 1 ? '' : 's'}</small>
        <strong>{pesos(total)}</strong>
      </div>
      <button type="button" className="boton" onClick={onAbrir}>{etiqueta}</button>
    </div>
  );
}
