import { useState } from 'react';
import { api, pesos } from '../services/api.js';
import { Campo, Cargando, Mensaje, Tarjeta, Vacio, useAviso, useDatos } from '../components/ui.jsx';

const VACIO = { nombre: '', cantidad: '', precio_compra: '', precio_venta: '', stock_minimo: '' };

/** HU-02 (registrar, editar y eliminar productos) y HU-04 (stock mínimo). */
export default function Productos() {
  const [buscar, setBuscar] = useState('');
  const productos = useDatos(() => api.get(`/productos?q=${encodeURIComponent(buscar)}`), [buscar]);
  const [form, setForm] = useState(null); // null = cerrado; {id?, ...campos}
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useAviso();

  const abrir = (p) => {
    setErrores({});
    setError('');
    setForm(p ? { ...p } : { ...VACIO });
  };
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErrores({});
    setError('');
    const cuerpo = { ...form, stock_minimo: form.stock_minimo === '' ? 0 : form.stock_minimo };
    try {
      if (form.id) await api.put(`/productos/${form.id}`, cuerpo);
      else await api.post('/productos', cuerpo);
      setAviso(form.id ? 'Producto actualizado' : 'Producto guardado');
      setForm(null);
      productos.recargar();
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  async function eliminar(p) {
    // HU-02 CA-3: pedir confirmación antes de borrar
    if (!window.confirm(`¿Seguro que quiere eliminar "${p.nombre}"?`)) return;
    try {
      await api.del(`/productos/${p.id}`);
      setAviso('Producto eliminado');
      setForm(null);
      productos.recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="titulo-con-accion">
        <h1 className="titulo">Productos</h1>
        {!form && <button type="button" className="boton" onClick={() => abrir(null)}>+ Nuevo producto</button>}
      </div>
      <Mensaje tipo="exito">{aviso}</Mensaje>

      {form && (
        <Tarjeta titulo={form.id ? 'Editar producto' : 'Nuevo producto'}>
          <form onSubmit={guardar} noValidate className="formulario">
            <Mensaje tipo="error">{error}</Mensaje>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              <input name="nombre" value={form.nombre} onChange={cambiar} autoFocus />
            </Campo>
            <div className="fila-campos">
              <Campo etiqueta="Cantidad en la tienda" error={errores.cantidad}>
                <input name="cantidad" type="number" inputMode="numeric" min="0" step="1" value={form.cantidad} onChange={cambiar} />
              </Campo>
              <Campo etiqueta="Avisarme cuando queden" error={errores.stock_minimo} ayuda="Deje 0 para no recibir aviso">
                <input name="stock_minimo" type="number" inputMode="numeric" min="0" step="1" value={form.stock_minimo} onChange={cambiar} />
              </Campo>
            </div>
            <div className="fila-campos">
              <Campo etiqueta="Precio de compra ($)" error={errores.precio_compra}>
                <input name="precio_compra" type="number" inputMode="decimal" min="0" value={form.precio_compra} onChange={cambiar} />
              </Campo>
              <Campo etiqueta="Precio de venta ($)" error={errores.precio_venta}>
                <input name="precio_venta" type="number" inputMode="decimal" min="0" value={form.precio_venta} onChange={cambiar} />
              </Campo>
            </div>
            <div className="acciones">
              <button className="boton">Guardar</button>
              <button type="button" className="boton boton-secundario" onClick={() => setForm(null)}>Cancelar</button>
              {form.id && <button type="button" className="boton boton-peligro" onClick={() => eliminar(form)}>Eliminar</button>}
            </div>
          </form>
        </Tarjeta>
      )}

      <Tarjeta>
        <Campo etiqueta="Buscar producto">
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escriba el nombre…" />
        </Campo>
        <Mensaje tipo="error">{productos.error}</Mensaje>
        {productos.cargando && !productos.datos ? <Cargando /> : productos.datos?.length ? (
          <ul className="lista lista-tocable">
            {productos.datos.map((p) => {
              const bajo = p.stock_minimo > 0 && p.cantidad <= p.stock_minimo;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => abrir(p)} aria-label={`Editar ${p.nombre}`}>
                    <span>
                      <strong>{p.nombre}</strong><br />
                      <small>Venta {pesos(p.precio_venta)} · Compra {pesos(p.precio_compra)}</small>
                    </span>
                    <span className={`etiqueta ${bajo ? 'etiqueta-aviso' : ''}`}>
                      {bajo && '⚠ '}{p.cantidad} und.
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <Vacio>{buscar ? 'No se encontraron productos.' : 'Aún no tiene productos. Toque "Nuevo producto" para empezar.'}</Vacio>}
      </Tarjeta>
    </>
  );
}
