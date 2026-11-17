import { NavLink, Outlet } from 'react-router-dom';
import { useSesion } from '../services/sesion.jsx';

const MENU = [
  { a: '/', texto: 'Inicio', icono: '🏠' },
  { a: '/vender', texto: 'Vender', icono: '🛒' },
  { a: '/productos', texto: 'Productos', icono: '📦' },
  { a: '/caja', texto: 'Caja', icono: '💵' },
  { a: '/fiado', texto: 'Fiado', icono: '📒' },
];

const MAS = [
  { a: '/comprar', texto: 'Registrar compra' },
  { a: '/reportes', texto: 'Reportes' },
  { a: '/historial', texto: 'Historial' },
];

export default function Layout() {
  const { usuario, salir } = useSesion();
  return (
    <div className="app">
      <header className="barra-superior">
        <div className="marca">
          <img src="/icono.svg" alt="" width="32" height="32" />
          <span>{usuario?.tienda}</span>
        </div>
        <nav className="menu-secundario" aria-label="Más opciones">
          {MAS.map((m) => <NavLink key={m.a} to={m.a}>{m.texto}</NavLink>)}
          <button type="button" className="boton-texto" onClick={salir}>Salir</button>
        </nav>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <nav className="menu-principal" aria-label="Menú principal">
        {MENU.map((m) => (
          <NavLink key={m.a} to={m.a} end={m.a === '/'}>
            <span className="menu-icono" aria-hidden="true">{m.icono}</span>
            <span>{m.texto}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
