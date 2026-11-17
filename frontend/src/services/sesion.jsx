import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, onSesionExpirada } from './api.js';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      setUsuario(await api.get('/auth/yo')); // HU-01 CA-4: la sesión sigue abierta
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    onSesionExpirada(() => setUsuario(null));
    recargar();
  }, [recargar]);

  const entrar = async (ruta, datos) => {
    await api.post(ruta, datos);
    await recargar();
  };
  const salir = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUsuario(null);
  };

  return (
    <SesionContext.Provider value={{ usuario, cargando, entrar, salir, recargar }}>
      {children}
    </SesionContext.Provider>
  );
}

export const useSesion = () => useContext(SesionContext);
