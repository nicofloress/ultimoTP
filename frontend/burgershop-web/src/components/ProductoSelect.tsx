import { useEffect, useMemo, useRef, useState } from 'react';
import { Producto, Categoria } from '../types';
import { getCategorias } from '../api/categorias';

interface Props {
  productos: Producto[];
  value: number | '' | 0;
  onChange: (id: number | '') => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onlyActivos?: boolean;
  renderSuffix?: (p: Producto) => string;
}

export default function ProductoSelect({
  productos,
  value,
  onChange,
  placeholder = 'Seleccionar producto...',
  disabled = false,
  className = '',
  onlyActivos = true,
  renderSuffix,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setBusqueda('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const megaPorCategoriaId = useMemo(() => {
    const m = new Map<number, string>();
    categorias.forEach(c => {
      if (c.categoriaPadreNombre) m.set(c.id, c.categoriaPadreNombre);
      else if (!c.categoriaPadreId) m.set(c.id, c.nombre);
    });
    return m;
  }, [categorias]);

  const productosFiltrados = useMemo(() => {
    const base = onlyActivos ? productos.filter(p => p.activo) : productos;
    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    return base.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.categoriaNombre?.toLowerCase().includes(q) ||
      (megaPorCategoriaId.get(p.categoriaId) || '').toLowerCase().includes(q)
    );
  }, [productos, busqueda, onlyActivos, megaPorCategoriaId]);

  const productoSeleccionado = useMemo(() => {
    if (value === '' || value === 0) return null;
    return productos.find(p => p.id === value) || null;
  }, [value, productos]);

  const suffixFor = (p: Producto) => (renderSuffix ? renderSuffix(p) : '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors text-left flex items-center justify-between gap-2 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}`}
      >
        <span className="truncate">
          {productoSeleccionado ? (
            <>
              {productoSeleccionado.nombre}
              {suffixFor(productoSeleccionado) && <span className="text-gray-500"> {suffixFor(productoSeleccionado)}</span>}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
              placeholder="Buscar..."
              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</li>
            ) : (
              productosFiltrados.map(p => {
                const mega = megaPorCategoriaId.get(p.categoriaId) || p.categoriaNombre || '';
                const seleccionado = p.id === value;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(p.id); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 hover:bg-amber-50 ${seleccionado ? 'bg-amber-100 font-medium' : ''}`}
                    >
                      <span className="truncate">
                        {p.nombre}
                        {suffixFor(p) && <span className="text-gray-500 ml-1">{suffixFor(p)}</span>}
                      </span>
                      {mega && (
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {mega}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
