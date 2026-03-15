import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { SignalRProvider } from './components/SignalRProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import POSPage from './pages/pos/POSPage';
import PedidosPage from './pages/pos/PedidosPage';
import HistorialPedidosPage from './pages/pos/HistorialPedidosPage';
import CatalogoLayout from './pages/catalogo/CatalogoLayout';
import CategoriasPage from './pages/catalogo/CategoriasPage';
import ProductosPage from './pages/catalogo/ProductosPage';
import CombosPage from './pages/catalogo/CombosPage';
import ProveedoresPage from './pages/catalogo/ProveedoresPage';
import RepartidoresPage from './pages/catalogo/RepartidoresPage';
import TiposClientePage from './pages/catalogo/TiposClientePage';
import ListasPrecioPage from './pages/catalogo/ListasPrecioPage';
import UsuariosPage from './pages/catalogo/UsuariosPage';
import EntregasPage from './pages/entregas/EntregasPage';
import TrackingMapaPage from './pages/entregas/TrackingMapaPage';
import ConfigPage from './pages/config/ConfigPage';
import CajaPage from './pages/finanzas/CajaPage';
import RepartidorApp from './pages/repartidor/RepartidorApp';
import { RolUsuario } from './types/auth';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SignalRProvider>
            <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/repartidor" element={
            <ProtectedRoute roles={[RolUsuario.Repartidor]}>
              <RepartidorApp />
            </ProtectedRoute>
          } />

          <Route element={
            <ProtectedRoute roles={[RolUsuario.Administrador, RolUsuario.Local]}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<POSPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/historial" element={<HistorialPedidosPage />} />
            <Route path="/catalogo" element={<CatalogoLayout />}>
              <Route index element={<Navigate to="categorias" replace />} />
              <Route path="categorias" element={<CategoriasPage />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="combos" element={<CombosPage />} />
              <Route path="proveedores" element={<ProveedoresPage />} />
              <Route path="repartidores" element={<RepartidoresPage />} />
              <Route path="tiposCliente" element={<TiposClientePage />} />
              <Route path="listasprecios" element={<ListasPrecioPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>
            <Route path="/finanzas/caja" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}>
                <CajaPage />
              </ProtectedRoute>
            } />
            <Route path="/reparto" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}>
                <EntregasPage />
              </ProtectedRoute>
            } />
            <Route path="/tracking" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}>
                <TrackingMapaPage />
              </ProtectedRoute>
            } />
            <Route path="/config" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}>
                <ConfigPage />
              </ProtectedRoute>
            } />
          </Route>
            </Routes>
          </SignalRProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
