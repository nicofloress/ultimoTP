import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RolUsuario } from '../types/auth';

interface MenuItem {
  to: string;
  label: string;
  end?: boolean;
  adminOnly?: boolean;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      { to: '/', label: 'POS', end: true },
      { to: '/pedidos', label: 'Pedidos' },
      { to: '/historial', label: 'Historial' },
    ],
  },
  {
    title: 'Administracion',
    items: [
      { to: '/catalogo/categorias', label: 'Categorias' },
      { to: '/catalogo/productos', label: 'Articulos' },
      { to: '/catalogo/combos', label: 'Combos' },
      { to: '/catalogo/repartidores', label: 'Repartidores', adminOnly: true },
      { to: '/catalogo/proveedores', label: 'Proveedores', adminOnly: true },
      { to: '/catalogo/tiposCliente', label: 'Tipos de Cliente', adminOnly: true },
      { to: '/catalogo/listasprecios', label: 'Listas de Precios', adminOnly: true },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/finanzas/caja', label: 'Caja Diaria', adminOnly: true },
    ],
  },
  {
    items: [
      { to: '/reparto', label: 'Reparto', adminOnly: true },
      { to: '/config', label: 'Configuracion', adminOnly: true },
    ],
  },
];

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/': 'Punto de Venta',
    '/pedidos': 'Pedidos',
    '/historial': 'Historial de Pedidos',
    '/catalogo/categorias': 'Categorias',
    '/catalogo/productos': 'Articulos',
    '/catalogo/combos': 'Combos',
    '/catalogo/repartidores': 'Repartidores',
    '/catalogo/proveedores': 'Proveedores',
    '/catalogo/tiposCliente': 'Tipos de Cliente',
    '/catalogo/listasprecios': 'Listas de Precios',
    '/finanzas/caja': 'Caja Diaria',
    '/reparto': 'Reparto',
    '/config': 'Configuracion',
  };
  return map[pathname] || 'Gestion HLP';
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const esAdmin = usuario?.rol === RolUsuario.Administrador;

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || esAdmin),
    }))
    .filter((section) => section.items.length > 0);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-slate-800 text-gray-300 z-40 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex-1 flex flex-col min-w-[16rem]">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-5 border-b border-slate-700">
            <span className="text-white font-bold text-lg tracking-tight">
              Gestion HLP
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3">
            {filteredSections.map((section, sIdx) => (
              <div key={sIdx}>
                {sIdx > 0 && (
                  <div className="mx-4 my-2 border-t border-slate-700" />
                )}
                {section.title && (
                  <div className="px-5 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `block mx-2 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-700 text-white border-l-4 border-amber-500 pl-2'
                          : 'hover:bg-slate-700/60 hover:text-white border-l-4 border-transparent pl-2'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-700 bg-slate-900 px-4 py-3">
            <div className="text-sm text-gray-300 truncate mb-2">
              {usuario?.nombreCompleto}
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {usuario?.rolNombre}
            </div>
            <button
              onClick={logout}
              className="w-full text-left text-sm text-gray-400 hover:text-white hover:bg-slate-700 px-3 py-2 rounded transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white shadow-md flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">
            {pageTitle}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
