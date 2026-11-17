import { useState } from 'react';
import { useSesion } from '../services/sesion.jsx';
import { Campo, Mensaje } from '../components/ui.jsx';

/** HU-01: registro e inicio de sesión. */
export default function Acceso() {
  const { entrar } = useSesion();
  const [modo, setModo] = useState('login');
  const [datos, setDatos] = useState({ tienda: '', usuario: '', password: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const esRegistro = modo === 'registro';

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setMensaje('');
    try {
      await entrar(esRegistro ? '/auth/registro' : '/auth/login', datos);
    } catch (err) {
      setErrores(err.detalles);
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="acceso">
      <div className="acceso-caja">
        <img src="/icono.svg" alt="" width="64" height="64" />
        <h1>Mi Tienda</h1>
        <p className="acceso-lema">Controle su inventario, su caja y el fiado desde el celular.</p>

        <div className="pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={!esRegistro} className={!esRegistro ? 'activa' : ''} onClick={() => setModo('login')}>Entrar</button>
          <button type="button" role="tab" aria-selected={esRegistro} className={esRegistro ? 'activa' : ''} onClick={() => setModo('registro')}>Crear cuenta</button>
        </div>

        <form onSubmit={enviar} noValidate>
          <Mensaje tipo="error">{mensaje}</Mensaje>
          {esRegistro && (
            <Campo etiqueta="Nombre de la tienda" error={errores.tienda}>
              <input name="tienda" value={datos.tienda} onChange={cambiar} autoComplete="organization" required />
            </Campo>
          )}
          <Campo etiqueta="Usuario" error={errores.usuario} ayuda={esRegistro ? 'Sin espacios. Ejemplo: tiendarosa' : undefined}>
            <input name="usuario" value={datos.usuario} onChange={cambiar} autoComplete="username" autoCapitalize="none" required />
          </Campo>
          <Campo etiqueta="Contraseña" error={errores.password} ayuda={esRegistro ? 'Mínimo 8 caracteres' : undefined}>
            <input name="password" type="password" value={datos.password} onChange={cambiar} autoComplete={esRegistro ? 'new-password' : 'current-password'} required />
          </Campo>
          <button className="boton boton-grande" disabled={enviando}>
            {enviando ? 'Un momento…' : esRegistro ? 'Crear mi cuenta' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
