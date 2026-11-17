import { useMemo, useState } from 'react';
import { pesos } from '../services/api.js';
import { Campo, Vacio } from './ui.jsx';

/**
 * Selector de productos y lista de ítems para ventas (HU-03, HU-06) y compras (HU-03).
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
  return { items, agregar, cambiar, quitar, vaciar };
}

export function SelectorProductos({ productos, onElegir, modo }) {
  const [buscar, setBuscar] = useState('');
  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (productos || []).filter((p) => !q || p.nombre.toLowerCase().includes(q)).slice(0, 30);
  }, [productos, buscar]);

  return (
    <div>
      <Campo etiqueta="Buscar producto">
        <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escriba el nombre…" />
      </Campo>
      {filtrados.length ? (
        <ul className="lista lista-tocable lista-compacta">
          {filtrados.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onElegir(p)} disabled={modo === 'venta' && p.cantidad <= 0}>
                <span>
                  <strong>{p.nombre}</strong><br />
                  <small>{modo === 'venta' ? pesos(p.precio_venta) : `Costo ${pesos(p.precio_compra)}`} · quedan {p.cantidad}</small>
                </span>
                <span className="boton-mas" aria-hidden="true">+</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <Vacio>No hay productos con ese nombre.</Vacio>}
    </div>
  );
}

export function ListaCarrito({ carrito, modo }) {
  const { items, cambiar, quitar } = carrito;
  if (!items.length) return <Vacio>Toque un producto para agregarlo.</Vacio>;
  return (
    <ul className="lista carrito">
      {items.map(({ producto: p, cantidad, costo }) => {
        const precio = modo === 'venta' ? p.precio_venta : Number(costo) || 0;
        const excede = modo === 'venta' && cantidad > p.cantidad;
        return (
          <li key={p.id} className={excede ? 'con-error' : ''}>
            <div className="carrito-nombre">
              <strong>{p.nombre}</strong>
              {excede && <small className="campo-error">Solo quedan {p.cantidad}</small>}
            </div>
            <div className="carrito-controles">
              <button type="button" className="boton-redondo" aria-label="Quitar uno" onClick={() => (cantidad > 1 ? cambiar(p.id, { cantidad: cantidad - 1 }) : quitar(p.id))}>−</button>
              <input
                className="carrito-cantidad" type="number" inputMode="numeric" min="1" aria-label={`Cantidad de ${p.nombre}`}
                value={cantidad} onChange={(e) => cambiar(p.id, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              />
              <button type="button" className="boton-redondo" aria-label="Agregar uno" onClick={() => cambiar(p.id, { cantidad: cantidad + 1 })}>+</button>
            </div>
            {modo === 'compra' && (
              <label className="carrito-costo">
                <small>Costo c/u</small>
                <input type="number" inputMode="decimal" min="0" value={costo} onChange={(e) => cambiar(p.id, { costo: e.target.value })} />
              </label>
            )}
            <span className="carrito-subtotal">{pesos(precio * cantidad)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function totalCarrito(items, modo) {
  return items.reduce((s, x) => s + (modo === 'venta' ? x.producto.precio_venta : Number(x.costo) || 0) * x.cantidad, 0);
}
