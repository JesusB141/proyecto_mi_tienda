import { useEffect, useState } from 'react';

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

/** Mensaje destacado: tipo = 'error' | 'exito' | 'aviso' */
export function Mensaje({ tipo = 'aviso', children, onCerrar }) {
  if (!children) return null;
  return (
    <div className={`mensaje mensaje-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onCerrar && <button type="button" className="mensaje-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>}
    </div>
  );
}

/** Mensaje de éxito que se oculta solo después de unos segundos. */
export function useAviso() {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);
  return [aviso, setAviso];
}

export function Tarjeta({ titulo, accion, children, className = '' }) {
  return (
    <section className={`tarjeta ${className}`}>
      {(titulo || accion) && (
        <div className="tarjeta-cabecera">
          {titulo && <h2>{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Cifra({ etiqueta, valor, tono }) {
  return (
    <div className={`cifra ${tono ? `cifra-${tono}` : ''}`}>
      <span className="cifra-etiqueta">{etiqueta}</span>
      <strong className="cifra-valor">{valor}</strong>
    </div>
  );
}

export function Vacio({ children }) {
  return <p className="vacio">{children}</p>;
}

export function Cargando() {
  return <p className="vacio" aria-busy="true">Cargando…</p>;
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
