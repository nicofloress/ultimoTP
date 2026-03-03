import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'POS' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/entregas', label: 'Entregas' },
  { to: '/config', label: 'Configuración' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-amber-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-8">
            <span className="font-bold text-xl tracking-tight">BurgerShop</span>
            <div className="flex gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isActive ? 'bg-amber-700' : 'hover:bg-amber-500'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
