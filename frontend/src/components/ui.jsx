import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, X } from 'lucide-react';

/** Campo de formulario con etiqueta visible y mensaje de error debajo. */
export function Campo({ etiqueta, error, ayuda, children }) {
  return (
    <label className={`campo${error ? ' con-error' : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      {children}
      {error ? <span className="campo-error" role="alert">{error}</span> : ayuda && <span className="campo-ayuda">{ayuda}</span>}
    </label>
  );
}

/** Mensaje en línea (errores de formulario o de carga). */
export function Mensaje({ tipo = 'error', children, onCerrar }) {
  if (!children) return null;
  const Icono = tipo === 'exito' ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`mensaje mensaje-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={18} aria-hidden="true" />
      <span>{children}</span>
      {onCerrar && (
        <button type="button" className="icono-btn" onClick={onCerrar} aria-label="Cerrar mensaje"><X size={16} /></button>
      )}
    </div>
  );
}

/* ---------- Avisos flotantes (toasts) ---------- */
const AvisosContext = createContext(() => {});

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto) => {
    const id = Date.now() + Math.random();
    setAvisos((xs) => [...xs, { id, texto }]);
    setTimeout(() => setAvisos((xs) => xs.filter((a) => a.id !== id)), 3500);
  }, []);
  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="aviso"><CheckCircle2 size={18} aria-hidden="true" />{a.texto}</div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}
export const useAvisar = () => useContext(AvisosContext);
/* ---------- Diálogo de confirmación ---------- */
export function Confirmar({ abierto, titulo, children, textoConfirmar = 'Confirmar', peligro, onConfirmar, onCancelar }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog ref={ref} className="dialogo" onCancel={(e) => { e.preventDefault(); onCancelar(); }}>
      <h2>{titulo}</h2>
      <div className="dialogo-cuerpo">{children}</div>
      <div className="acciones acciones-fin">
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="button" className={`boton${peligro ? ' boton-peligro-lleno' : ''}`} onClick={onConfirmar} autoFocus>{textoConfirmar}</button>
      </div>
    </dialog>
  );
}

/* ---------- Bloques de página ---------- */
export function Seccion({ titulo, accion, children, className = '' }) {
  return (
    <section className={`seccion ${className}`}>
      {(titulo || accion) && (
        <header className="seccion-cabecera">
          {titulo && <h2>{titulo}</h2>}
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

export function Cifra({ etiqueta, valor, tono }) {
  return (
    <div className={`cifra${tono ? ` cifra-${tono}` : ''}`}>
      <span className="cifra-etiqueta">{etiqueta}</span>
      <strong className="cifra-valor">{valor}</strong>
    </div>
  );
}

export function Vacio({ children, icono: Icono = Inbox }) {
  return (
    <div className="vacio">
      <Icono size={28} strokeWidth={1.5} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function Cargando() {
  return (
    <div className="cargando" aria-busy="true" aria-label="Cargando">
      <span /><span /><span />
    </div>
  );
}

export function EncabezadoPagina({ titulo, subtitulo, accion }) {
  return (
    <div className="encabezado-pagina">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

/** Hook para cargar datos de la API con estado de carga y error. */
export function useDatos(cargar, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let vigente = true;
    setEstado((e) => ({ ...e, cargando: true }));
    cargar()
      .then((datos) => vigente && setEstado({ datos, error: null, cargando: false }))
      .catch((error) => vigente && setEstado({ datos: null, error: error.message, cargando: false }));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);
  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
