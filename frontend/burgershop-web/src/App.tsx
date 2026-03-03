import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POSPage from './pages/pos/POSPage';
import PedidosPage from './pages/pos/PedidosPage';
import CatalogoLayout from './pages/catalogo/CatalogoLayout';
import CategoriasPage from './pages/catalogo/CategoriasPage';
import ProductosPage from './pages/catalogo/ProductosPage';
import CombosPage from './pages/catalogo/CombosPage';
import EntregasPage from './pages/entregas/EntregasPage';
import ConfigPage from './pages/config/ConfigPage';
import RepartidorApp from './pages/repartidor/RepartidorApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App del repartidor (sin layout) */}
        <Route path="/repartidor" element={<RepartidorApp />} />

        {/* App principal con layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<POSPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/catalogo" element={<CatalogoLayout />}>
            <Route index element={<Navigate to="categorias" replace />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="combos" element={<CombosPage />} />
          </Route>
          <Route path="/entregas" element={<EntregasPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
