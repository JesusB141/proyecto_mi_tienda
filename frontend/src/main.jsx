import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { SesionProvider, useSesion } from './services/sesion.jsx';
import Layout from './components/Layout.jsx';
import Acceso from './pages/Acceso.jsx';
import Inicio from './pages/Inicio.jsx';
import Productos from './pages/Productos.jsx';
import Vender from './pages/Vender.jsx';
import Comprar from './pages/Comprar.jsx';
import Caja from './pages/Caja.jsx';
import Fiado from './pages/Fiado.jsx';
import Reportes from './pages/Reportes.jsx';
import Historial from './pages/Historial.jsx';

function Rutas() {
  const { usuario, cargando } = useSesion();
  if (cargando) return <p className="vacio">Cargando…</p>;
  if (!usuario) return <Acceso />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="productos" element={<Productos />} />
        <Route path="vender" element={<Vender />} />
        <Route path="comprar" element={<Comprar />} />
        <Route path="caja" element={<Caja />} />
        <Route path="fiado" element={<Fiado />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="historial" element={<Historial />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <Rutas />
      </SesionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
