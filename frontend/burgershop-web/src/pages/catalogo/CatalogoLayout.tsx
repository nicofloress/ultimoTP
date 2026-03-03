import { NavLink, Outlet } from 'react-router-dom';

export default function CatalogoLayout() {
  return (
    <div>
      <div className="flex gap-4 mb-6">
        <NavLink to="/catalogo/categorias" className={({ isActive }) => `px-4 py-2 rounded font-medium ${isActive ? 'bg-amber-600 text-white' : 'bg-white shadow hover:bg-gray-50'}`}>Categorías</NavLink>
        <NavLink to="/catalogo/productos" className={({ isActive }) => `px-4 py-2 rounded font-medium ${isActive ? 'bg-amber-600 text-white' : 'bg-white shadow hover:bg-gray-50'}`}>Productos</NavLink>
        <NavLink to="/catalogo/combos" className={({ isActive }) => `px-4 py-2 rounded font-medium ${isActive ? 'bg-amber-600 text-white' : 'bg-white shadow hover:bg-gray-50'}`}>Combos</NavLink>
      </div>
      <Outlet />
    </div>
  );
}
