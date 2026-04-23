import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocalActivo } from '../context/LocalContext';
import { useTheme } from '../context/ThemeContext';

declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// Guardar fecha de la última actualización de versión
const VERSION_DATE_KEY = 'app_version_date';
const VERSION_KEY = 'app_version_current';
(() => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== APP_VERSION) {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(VERSION_DATE_KEY, new Date().toISOString());
  }
})();
const fechaVersion = localStorage.getItem(VERSION_DATE_KEY);
import { RolUsuario } from '../types/auth';

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

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
      { to: '/pos', label: 'POS' },
      { to: '/', label: 'Dashboard', end: true },
      { to: '/ventas', label: 'Ventas' },
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
      { to: '/catalogo/repartidores', label: 'Repartidores', roles: [SA, AD] },
      { to: '/catalogo/proveedores', label: 'Proveedores', roles: [SA] },
      { to: '/catalogo/listasprecios', label: 'Listas de Precios', roles: [SA] },
      { to: '/catalogo/usuarios', label: 'Usuarios', roles: [SA] },
      { to: '/catalogo/promociones', label: 'Promociones', roles: [SA] },
      { to: '/catalogo/zonas', label: 'Zonas', roles: [SA, AD] },
      { to: '/catalogo/marcas', label: 'Marcas', roles: [SA, AD] },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/finanzas/caja', label: 'Caja Diaria', roles: [SA, AD, LO] },
      { to: '/finanzas/rendiciones', label: 'Rendiciones', roles: [SA, AD] },
      { to: '/finanzas/cuenta-corriente', label: 'Cuenta Corriente', roles: [SA, AD, LO] },
      { to: '/finanzas/gastos', label: 'Gastos', roles: [SA, AD] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { to: '/inventario/movimientos', label: 'Movimientos', roles: [SA, AD] },
      { to: '/inventario/compras', label: 'Compras', roles: [SA] },
      { to: '/inventario/transferencias', label: 'Transferencias', roles: [SA, AD] },
      { to: '/inventario/devoluciones', label: 'Devoluciones' },
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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { usuario, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const userRol = usuario?.rol;
  const { locales, localActivo, setLocalActivo, esSuperAdmin } = useLocalActivo();

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || (userRol !== undefined && item.roles.includes(userRol))),
    }))
    .filter((section) => section.items.length > 0);

  // Estado colapsable por sección (persistido en localStorage)
  const [seccionesColapsadas, setSeccionesColapsadas] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('sidebar_secciones_colapsadas');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const toggleSeccion = (title: string) => {
    setSeccionesColapsadas(prev => {
      const next = { ...prev, [title]: !prev[title] };
      try { localStorage.setItem('sidebar_secciones_colapsadas', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);

  useEffect(() => {
    // Solo chequear version en produccion (evita loops en dev local)
    if (import.meta.env.DEV) return;

    let actualizando = false;
    const autoActualizar = async () => {
      if (actualizando) return;
      actualizando = true;
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch { /* ignore */ }
      window.location.href = window.location.pathname + '?_v=' + Date.now();
    };
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          setHayNuevaVersion(true);
          autoActualizar();
        }
      } catch { /* ignore */ }
    };
    checkVersion();
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 dark:text-gray-100 transition-colors">
      {/* Header fijo - siempre arriba, todo el ancho */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-600 border-b border-slate-700 flex items-center px-2 sm:px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded hover:bg-slate-600 transition-colors text-slate-200 flex-shrink-0"
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
        <div className="ml-1 sm:ml-3 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 32 32" fill="none">
            <path d="M4 14h24c0-6-5.4-10-12-10S4 8 4 14z" fill="#F59E0B" />
            <ellipse cx="11" cy="9" rx="1.2" ry="0.8" fill="#FEF3C7" />
            <ellipse cx="17" cy="7.5" rx="1.2" ry="0.8" fill="#FEF3C7" />
            <ellipse cx="22" cy="10" rx="1.2" ry="0.8" fill="#FEF3C7" />
            <path d="M3 14.5c1.5 1.5 3 0 4.5 1.5s3 0 4.5 1.5 3 0 4.5 1.5 3 0 4.5-1.5 3 0 4.5-1.5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="3.5" y="17" width="25" height="3.5" rx="1.5" fill="#92400E" />
            <path d="M3 17l2-1.5h22l2 1.5" fill="#FBBF24" />
            <rect x="4" y="21" width="24" height="4" rx="2" fill="#D97706" />
          </svg>
          <span className="text-sm sm:text-base font-bold text-white tracking-tight hidden sm:inline">
            Gestion HLP
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
            {usuario?.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm font-semibold text-white leading-tight truncate">{usuario?.nombreCompleto}</div>
            <div className="text-xs text-slate-300 leading-tight">{usuario?.rolNombre}</div>
          </div>
        </div>
        {esSuperAdmin && (
          <div className="hidden md:flex items-center gap-2 mr-2 lg:mr-4 flex-shrink-0">
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select
              value={localActivo}
              onChange={e => setLocalActivo(Number(e.target.value))}
              className="bg-slate-700 text-white text-sm border border-slate-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[140px] lg:min-w-[180px]"
            >
              {locales.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 006.002-2.082z" />
            </svg>
          )}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ml-1 sm:ml-2 flex-shrink-0"
          title="Cerrar sesion"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - debajo del header */}
      <aside
        className={`fixed top-14 left-0 bottom-0 bg-gradient-to-b from-slate-600 to-slate-900 shadow-2xl text-gray-300 z-40 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex-1 flex flex-col min-w-[16rem]">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 sidebar-scroll">
            {filteredSections.map((section, sIdx) => {
              const colapsada = section.title ? !!seccionesColapsadas[section.title] : false;
              return (
                <div key={sIdx}>
                  {sIdx > 0 && (
                    <div className="mx-4 my-1 border-t border-slate-700" />
                  )}
                  {section.title ? (
                    <button
                      onClick={() => toggleSeccion(section.title!)}
                      className="w-full flex items-center justify-between px-5 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                      aria-expanded={!colapsada}
                      aria-label={`${colapsada ? 'Expandir' : 'Colapsar'} ${section.title}`}
                    >
                      <span>{section.title}</span>
                      <svg
                        className={`w-3 h-3 transition-transform ${colapsada ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : null}
                  {!colapsada && section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => { if (isMobile) setSidebarOpen(false); }}
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
              );
            })}
          </nav>
          {/* Version label */}
          <div className="px-4 py-2 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">v{APP_VERSION}</span>
              {hayNuevaVersion ? (
                <span className="text-[9px] text-amber-400 font-medium animate-pulse">
                  Actualizando...
                </span>
              ) : fechaVersion && (
                <span className="text-[9px] text-slate-400">
                  {new Date(fechaVersion).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area - debajo del header, al lado del sidebar */}
      <div
        className={`pt-14 transition-all duration-300 ${
          sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
        }`}
      >
        <main className="p-2 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
