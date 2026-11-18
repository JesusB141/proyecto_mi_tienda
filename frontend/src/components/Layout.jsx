import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3, BookUser, History, House, LogOut, Menu, Package, ShoppingCart, Truck, Wallet, X,
} from 'lucide-react';
import { useSesion } from '../services/sesion.jsx';
import Marca from './Marca.jsx';

const PRINCIPAL = [
  { a: '/', texto: 'Inicio', icono: House },
  { a: '/productos', texto: 'Productos', icono: Package },
  { a: '/vender', texto: 'Vender', icono: ShoppingCart, destacado: true },
  { a: '/caja', texto: 'Caja', icono: Wallet },
  { a: '/fiado', texto: 'Fiado', icono: BookUser },
];

const SECUNDARIO = [
  { a: '/comprar', texto: 'Registrar compra', icono: Truck },
  { a: '/reportes', texto: 'Reportes', icono: BarChart3 },
  { a: '/historial', texto: 'Historial', icono: History },
];

function Enlace({ item, onClick }) {
  const Icono = item.icono;
  return (
    <NavLink to={item.a} end={item.a === '/'} onClick={onClick} className={item.destacado ? 'destacado' : undefined}>
      <Icono size={20} strokeWidth={1.8} aria-hidden="true" />
      <span>{item.texto}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { usuario, salir } = useSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMenuAbierto(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const cerrar = (e) => e.key === 'Escape' && setMenuAbierto(false);
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [menuAbierto]);

  return (
    <div className="app">
      {/* Barra lateral (computador) */}
      <aside className="lateral" aria-label="Menú">
        <div className="lateral-marca">
          <Marca />
          <div>
            <strong>{usuario?.tienda}</strong>
            <small>@{usuario?.usuario}</small>
          </div>
        </div>
        <nav className="lateral-nav">
          {PRINCIPAL.map((m) => <Enlace key={m.a} item={m} />)}
          <span className="lateral-separador">Más</span>
          {SECUNDARIO.map((m) => <Enlace key={m.a} item={m} />)}
        </nav>
        <button type="button" className="lateral-salir" onClick={salir}>
          <LogOut size={18} aria-hidden="true" /> Cerrar sesión
        </button>
      </aside>

      {/* Barra superior (celular) */}
      <header className="superior">
        <div className="superior-marca">
          <Marca />
          <strong>{usuario?.tienda}</strong>
        </div>
        <button type="button" className="icono-btn" onClick={() => setMenuAbierto(true)} aria-label="Más opciones" aria-expanded={menuAbierto}>
          <Menu size={22} />
        </button>
      </header>

      <main className="contenido">
        <Outlet />
      </main>

      {/* Barra inferior (celular) */}
      <nav className="inferior" aria-label="Menú principal">
        {PRINCIPAL.map((m) => <Enlace key={m.a} item={m} />)}
      </nav>

      {/* Hoja de opciones secundarias (celular) */}
      {menuAbierto && (
        <div className="hoja-fondo" onClick={() => setMenuAbierto(false)}>
          <div className="hoja" role="dialog" aria-modal="true" aria-label="Más opciones" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabecera">
              <div>
                <strong>{usuario?.tienda}</strong>
                <small>@{usuario?.usuario}</small>
              </div>
              <button type="button" className="icono-btn" onClick={() => setMenuAbierto(false)} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <nav className="hoja-nav">
              {SECUNDARIO.map((m) => <Enlace key={m.a} item={m} />)}
              <button type="button" onClick={salir}><LogOut size={20} strokeWidth={1.8} aria-hidden="true" /><span>Cerrar sesión</span></button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
