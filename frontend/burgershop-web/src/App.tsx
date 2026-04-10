import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocalProvider } from './context/LocalContext';
import { ToastProvider } from './components/Toast';
import { SignalRProvider } from './components/SignalRProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import POSPage from './pages/pos/POSPage';
import PedidosPage from './pages/pos/PedidosPage';
import HistorialPedidosPage from './pages/pos/HistorialPedidosPage';
import VentasPage from './pages/pos/VentasPage';
import CatalogoLayout from './pages/catalogo/CatalogoLayout';

import ProductosPage from './pages/catalogo/ProductosPage';
import CombosPage from './pages/catalogo/CombosPage';
import ProveedoresPage from './pages/catalogo/ProveedoresPage';
import RepartidoresPage from './pages/catalogo/RepartidoresPage';

import ClientesPage from './pages/catalogo/ClientesPage';
import ListasPrecioPage from './pages/catalogo/ListasPrecioPage';
import UsuariosPage from './pages/catalogo/UsuariosPage';
import EntregasPage from './pages/entregas/EntregasPage';
import ControlCamionetasPage from './pages/entregas/ControlCamionetasPage';
import TrackingMapaPage from './pages/entregas/TrackingMapaPage';
import ConfigPage from './pages/config/ConfigPage';
import CajaPage from './pages/finanzas/CajaPage';
import RendicionesPage from './pages/finanzas/RendicionesPage';
import CuentaCorrientePage from './pages/finanzas/CuentaCorrientePage';
import GastosPage from './pages/finanzas/GastosPage';
import RepartidorApp from './pages/repartidor/RepartidorApp';
import DepositoPage from './pages/deposito/DepositoPage';
import DepositoLogin from './pages/deposito/DepositoLogin';
import { useAuth } from './context/AuthContext';
import MovimientosPage from './pages/inventario/MovimientosPage';
import ComprasPage from './pages/inventario/ComprasPage';
import DevolucionesPage from './pages/inventario/DevolucionesPage';
import StockPage from './pages/inventario/StockPage';

import PromocionesPage from './pages/catalogo/PromocionesPage';
import ZonasPage from './pages/catalogo/ZonasPage';
import MarcasPage from './pages/catalogo/MarcasPage';
import LogsPage from './pages/sistema/LogsPage';
import { RolUsuario } from './types/auth';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <LocalProvider>
          <SignalRProvider>
            <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/deposito" element={<DepositoRoute />} />

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
            {/* Todas las rutas — SuperAdmin siempre accede via ProtectedRoute */}
            <Route path="/" element={<POSPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/historial" element={<HistorialPedidosPage />} />
            <Route path="/reparto" element={<EntregasPage />} />
            <Route path="/control-camionetas" element={<ControlCamionetasPage />} />
            <Route path="/tracking" element={<TrackingMapaPage />} />
            <Route path="/finanzas/cuenta-corriente" element={<CuentaCorrientePage />} />
            <Route path="/catalogo" element={<CatalogoLayout />}>
              <Route index element={<Navigate to="productos" replace />} />
              <Route path="productos" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><ProductosPage /></ProtectedRoute>
              } />
              <Route path="combos" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><CombosPage /></ProtectedRoute>
              } />
              <Route path="proveedores" element={
                <ProtectedRoute roles={[]}><ProveedoresPage /></ProtectedRoute>
              } />
              <Route path="repartidores" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><RepartidoresPage /></ProtectedRoute>
              } />
              <Route path="clientes" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><ClientesPage /></ProtectedRoute>
              } />
              <Route path="listasprecios" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><ListasPrecioPage /></ProtectedRoute>
              } />
              <Route path="usuarios" element={
                <ProtectedRoute roles={[]}><UsuariosPage /></ProtectedRoute>
              } />
              <Route path="promociones" element={
                <ProtectedRoute roles={[]}><PromocionesPage /></ProtectedRoute>
              } />
              <Route path="zonas" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><ZonasPage /></ProtectedRoute>
              } />
              <Route path="marcas" element={
                <ProtectedRoute roles={[RolUsuario.Administrador]}><MarcasPage /></ProtectedRoute>
              } />
            </Route>
            <Route path="/finanzas/caja" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><CajaPage /></ProtectedRoute>
            } />
            <Route path="/finanzas/rendiciones" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><RendicionesPage /></ProtectedRoute>
            } />
            <Route path="/finanzas/gastos" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><GastosPage /></ProtectedRoute>
            } />
            <Route path="/inventario/movimientos" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><MovimientosPage /></ProtectedRoute>
            } />
            <Route path="/inventario/compras" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><ComprasPage /></ProtectedRoute>
            } />
            <Route path="/inventario/devoluciones" element={<DevolucionesPage />} />
            <Route path="/inventario/stock" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}><StockPage /></ProtectedRoute>
            } />
            <Route path="/sistema/logs" element={
              <ProtectedRoute roles={[]}><LogsPage /></ProtectedRoute>
            } />
            <Route path="/config" element={
              <ProtectedRoute roles={[RolUsuario.Administrador]}>
                <ConfigPage />
              </ProtectedRoute>
            } />
          </Route>
            </Routes>
          </SignalRProvider>
          </LocalProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

function DepositoRoute() {
  const { usuario, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gray-900 text-white text-xl">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return <DepositoLogin />;
  }

  const rolValido =
    usuario.rol === RolUsuario.Deposito || usuario.rol === RolUsuario.SuperAdmin;

  if (!rolValido) {
    return <DepositoLogin error="Acceso denegado, solo usuarios de depósito" />;
  }

  return <DepositoPage />;
}
