import { useState } from 'react';
import { ChevronRight, Package, Plus, Search } from 'lucide-react';
import { api, pesos } from '../services/api.js';
import { Campo, Cargando, Confirmar, EncabezadoPagina, Mensaje, Seccion, Vacio, useAvisar, useDatos } from '../components/ui.jsx';

const VACIO = { nombre: '', cantidad: '', precio_compra: '', precio_venta: '', stock_minimo: '' };

/** HU-02 (registrar, editar y eliminar productos) y HU-04 (stock mínimo). */
export default function Productos() {
  const [buscar, setBuscar] = useState('');
  const productos = useDatos(() => api.get(`/productos?q=${encodeURIComponent(buscar)}`), [buscar]);
  const [form, setForm] = useState(null); // null = cerrado
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const avisar = useAvisar();

  const abrir = (p) => {
    setErrores({});
    setError('');
    setForm(p ? { ...p } : { ...VACIO });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      avisar(form.id ? 'Producto actualizado' : 'Producto guardado');
      setForm(null);
      productos.recargar();
    } catch (err) {
      setErrores(err.detalles);
      setError(err.message);
    }
  }

  // HU-02 CA-3: se pide confirmación antes de eliminar
  async function eliminar() {
    const p = aEliminar;
    setAEliminar(null);
    try {
      await api.del(`/productos/${p.id}`);
      avisar(`«${p.nombre}» eliminado`);
      setForm(null);
      productos.recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Productos"
        subtitulo={productos.datos ? `${productos.datos.length} producto${productos.datos.length === 1 ? '' : 's'} en el inventario` : undefined}
        accion={!form && <button type="button" className="boton" onClick={() => abrir(null)}><Plus size={18} />Nuevo producto</button>}
      />

      {form && (
        <Seccion titulo={form.id ? 'Editar producto' : 'Nuevo producto'}>
          <form onSubmit={guardar} noValidate className="formulario">
            <Mensaje>{error}</Mensaje>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              <input name="nombre" value={form.nombre} onChange={cambiar} autoFocus placeholder="Ej.: Arroz Diana 500 g" />
            </Campo>
            <div className="fila-campos">
              <Campo etiqueta="Precio de compra" error={errores.precio_compra}>
                <input name="precio_compra" type="number" inputMode="decimal" min="0" value={form.precio_compra} onChange={cambiar} placeholder="$" />
              </Campo>
              <Campo etiqueta="Precio de venta" error={errores.precio_venta}>
                <input name="precio_venta" type="number" inputMode="decimal" min="0" value={form.precio_venta} onChange={cambiar} placeholder="$" />
              </Campo>
            </div>
            <div className="fila-campos">
              <Campo etiqueta="Unidades en la tienda" error={errores.cantidad}>
                <input name="cantidad" type="number" inputMode="numeric" min="0" step="1" value={form.cantidad} onChange={cambiar} />
              </Campo>
              <Campo etiqueta="Avisarme cuando queden" error={errores.stock_minimo} ayuda="Deje vacío para no recibir aviso">
                <input name="stock_minimo" type="number" inputMode="numeric" min="0" step="1" value={form.stock_minimo} onChange={cambiar} />
              </Campo>
            </div>
            <div className="acciones">
              <button className="boton">Guardar</button>
              <button type="button" className="boton boton-secundario" onClick={() => setForm(null)}>Cancelar</button>
              {form.id && <button type="button" className="boton boton-peligro" onClick={() => setAEliminar(form)}>Eliminar</button>}
            </div>
          </form>
        </Seccion>
      )}

      <Seccion>
        <label className="buscador">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" />
        </label>
        <Mensaje>{productos.error}</Mensaje>
        {productos.cargando && !productos.datos ? <Cargando /> : productos.datos?.length ? (
          <ul className="lista lista-tocable">
            {productos.datos.map((p) => {
              const bajo = p.stock_minimo > 0 && p.cantidad <= p.stock_minimo;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => abrir(p)} aria-label={`Editar ${p.nombre}`}>
                    <span className="lista-texto">
                      <strong>{p.nombre}</strong>
                      <small>Venta {pesos(p.precio_venta)} · Compra {pesos(p.precio_compra)}</small>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`etiqueta${bajo ? ' etiqueta-aviso' : ''}`}>{p.cantidad} und.</span>
                      <ChevronRight size={18} className="chevron" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <Vacio icono={Package}>{buscar ? 'No se encontraron productos.' : 'Aún no tiene productos. Use «Nuevo producto» para empezar.'}</Vacio>}
      </Seccion>

      <Confirmar
        abierto={Boolean(aEliminar)}
        titulo="¿Eliminar este producto?"
        textoConfirmar="Sí, eliminar"
        peligro
        onConfirmar={eliminar}
        onCancelar={() => setAEliminar(null)}
      >
        «{aEliminar?.nombre}» dejará de aparecer en el inventario. Las ventas y compras ya registradas se conservan en el historial.
      </Confirmar>
    </>
  );
}
