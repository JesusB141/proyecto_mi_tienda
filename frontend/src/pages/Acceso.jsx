import { useState } from 'react';
import { BookUser, PackageCheck, Wallet } from 'lucide-react';
import { useSesion } from '../services/sesion.jsx';
import { Campo, Mensaje } from '../components/ui.jsx';
import Marca from '../components/Marca.jsx';

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
  const cambiarModo = (m) => { setModo(m); setErrores({}); setMensaje(''); };

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
      <section className="acceso-panel">
        <div className="acceso-caja">
          <header>
            <Marca tamano={44} />
            <h1>{esRegistro ? 'Cree la cuenta de su tienda' : 'Entre a su tienda'}</h1>
            <p>{esRegistro ? 'Solo necesita el nombre de la tienda, un usuario y una contraseña.' : 'Inventario, caja y fiado en un solo lugar.'}</p>
          </header>

          <div className="segmentos" role="tablist">
            <button type="button" role="tab" aria-selected={!esRegistro} className={!esRegistro ? 'activo' : ''} onClick={() => cambiarModo('login')}>Entrar</button>
            <button type="button" role="tab" aria-selected={esRegistro} className={esRegistro ? 'activo' : ''} onClick={() => cambiarModo('registro')}>Crear cuenta</button>
          </div>

          <form onSubmit={enviar} noValidate>
            <Mensaje>{mensaje}</Mensaje>
            {esRegistro && (
              <Campo etiqueta="Nombre de la tienda" error={errores.tienda}>
                <input name="tienda" value={datos.tienda} onChange={cambiar} autoComplete="organization" placeholder="Ej.: Tienda Doña Rosa" />
              </Campo>
            )}
            <Campo etiqueta="Usuario" error={errores.usuario} ayuda={esRegistro ? 'Sin espacios ni tildes' : undefined}>
              <input name="usuario" value={datos.usuario} onChange={cambiar} autoComplete="username" autoCapitalize="none" spellCheck="false" />
            </Campo>
            <Campo etiqueta="Contraseña" error={errores.password} ayuda={esRegistro ? 'Mínimo 8 caracteres' : undefined}>
              <input name="password" type="password" value={datos.password} onChange={cambiar} autoComplete={esRegistro ? 'new-password' : 'current-password'} />
            </Campo>
            <button className="boton boton-bloque" disabled={enviando}>
              {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
      <aside className="acceso-lado" aria-hidden="true">
        <h2>Las cuentas claras de la tienda, todos los días.</h2>
        <ul>
          <li><PackageCheck size={20} />Sepa qué tiene en los estantes y qué está por acabarse.</li>
          <li><Wallet size={20} />Vea cuánto entró y cuánto salió de la caja hoy.</li>
          <li><BookUser size={20} />Lleve el fiado sin cuaderno: quién debe, cuánto y cuándo paga.</li>
        </ul>
      </aside>
    </main>
  );
}
