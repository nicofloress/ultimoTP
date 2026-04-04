import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RolUsuario } from '../types/auth';

interface MenuItem {
  to: string;
  label: string;
  end?: boolean;
  roles?: RolUsuario[]; // Si no se especifica, todos pueden ver
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const SA = RolUsuario.SuperAdmin;
const AD = RolUsuario.Administrador;
const LO = RolUsuario.Local;

const menuSections: MenuSection[] = [
  {
    items: [
      { to: '/', label: 'POS', end: true },
    ],
  },
  {
    title: 'Reparto',
    items: [
      { to: '/pedidos', label: 'Alta de Pedidos' },
      { to: '/reparto', label: 'Entregas' },
      { to: '/control-camionetas', label: 'Control Camionetas' },
      { to: '/tracking', label: 'Tracking' },
      { to: '/historial', label: 'Historial' },
    ],
  },
  {
    title: 'Administracion',
    items: [
      { to: '/catalogo/clientes', label: 'Clientes', roles: [SA, AD] },
      { to: '/catalogo/productos', label: 'Articulos', roles: [SA, AD] },
      { to: '/catalogo/combos', label: 'Combos', roles: [SA, AD] },
      { to: '/catalogo/repartidores', label: 'Repartidores', roles: [SA, AD] },
      { to: '/catalogo/proveedores', label: 'Proveedores', roles: [SA] },
      { to: '/catalogo/listasprecios', label: 'Listas de Precios', roles: [SA, AD] },
      { to: '/catalogo/usuarios', label: 'Usuarios', roles: [SA] },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/finanzas/caja', label: 'Caja Diaria', roles: [SA, AD] },
      { to: '/finanzas/rendiciones', label: 'Rendiciones', roles: [SA, AD] },
      { to: '/finanzas/cuenta-corriente', label: 'Cuenta Corriente', roles: [SA, AD, LO] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { to: '/inventario/movimientos', label: 'Movimientos', roles: [SA, AD] },
      { to: '/inventario/stock', label: 'Stock', roles: [SA, AD] },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/sistema/logs', label: 'Logs', roles: [SA] },
    ],
  },
  {
    items: [
      { to: '/config', label: 'Configuracion', roles: [SA] },
    ],
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { usuario, logout } = useAuth();

  const userRol = usuario?.rol;

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || (userRol !== undefined && item.roles.includes(userRol))),
    }))
    .filter((section) => section.items.length > 0);


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fijo - siempre arriba, todo el ancho */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-600 border-b border-slate-700 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded hover:bg-slate-600 transition-colors text-slate-200"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-5 h-5"
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
        <div className="ml-3 flex items-center gap-2">
          {/* Icono hamburguesa */}
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            {/* Pan superior (dome) */}
            <path d="M4 14h24c0-6-5.4-10-12-10S4 8 4 14z" fill="#F59E0B" />
            {/* Sesamo */}
            <ellipse cx="11" cy="9" rx="1.2" ry="0.8" fill="#FEF3C7" />
            <ellipse cx="17" cy="7.5" rx="1.2" ry="0.8" fill="#FEF3C7" />
            <ellipse cx="22" cy="10" rx="1.2" ry="0.8" fill="#FEF3C7" />
            {/* Lechuga */}
            <path d="M3 14.5c1.5 1.5 3 0 4.5 1.5s3 0 4.5 1.5 3 0 4.5 1.5 3 0 4.5-1.5 3 0 4.5-1.5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
            {/* Carne */}
            <rect x="3.5" y="17" width="25" height="3.5" rx="1.5" fill="#92400E" />
            {/* Queso */}
            <path d="M3 17l2-1.5h22l2 1.5" fill="#FBBF24" />
            {/* Pan inferior */}
            <rect x="4" y="21" width="24" height="4" rx="2" fill="#D97706" />
          </svg>
          <span className="text-base font-bold text-white tracking-tight">
            Gestion HLP
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold">
            {usuario?.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">{usuario?.nombreCompleto}</div>
            <div className="text-xs text-slate-300 leading-tight">{usuario?.rolNombre}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </header>

      {/* Sidebar - debajo del header */}
      <aside
        className={`fixed top-14 left-0 bottom-0 bg-gradient-to-b from-slate-600 to-slate-900 shadow-2xl text-gray-300 z-40 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex-1 flex flex-col min-w-[16rem]">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 sidebar-scroll">
            {filteredSections.map((section, sIdx) => (
              <div key={sIdx}>
                {sIdx > 0 && (
                  <div className="mx-4 my-1 border-t border-slate-700" />
                )}
                {section.title && (
                  <div className="px-5 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `block mx-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
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
        </div>
      </aside>

      {/* Main content area - debajo del header, al lado del sidebar */}
      <div
        className={`pt-14 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Page content */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
