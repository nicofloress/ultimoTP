import { useEffect, useMemo, useRef, useState } from 'react';
import { Combo } from '../types';

interface Props {
  combos: Combo[];
  value: number | '' | 0;
  onChange: (id: number | '') => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onlyActivos?: boolean;
  renderSuffix?: (c: Combo) => string;
}

export default function ComboSelect({
  combos,
  value,
  onChange,
  placeholder = 'Seleccionar combo...',
  disabled = false,
  className = '',
  onlyActivos = true,
  renderSuffix,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const combosFiltrados = useMemo(() => {
    const base = onlyActivos ? combos.filter(c => c.activo) : combos;
    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    return base.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.descripcion?.toLowerCase().includes(q) ?? false)
    );
  }, [combos, busqueda, onlyActivos]);

  const comboSeleccionado = useMemo(() => {
    if (value === '' || value === 0) return null;
    return combos.find(c => c.id === value) || null;
  }, [value, combos]);

  const suffixFor = (c: Combo) => (renderSuffix ? renderSuffix(c) : '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors text-left flex items-center justify-between gap-2 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}`}
      >
        <span className="truncate">
          {comboSeleccionado ? (
            <>
              {comboSeleccionado.nombre}
              {suffixFor(comboSeleccionado) && <span className="text-gray-500"> {suffixFor(comboSeleccionado)}</span>}
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
            {combosFiltrados.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</li>
            ) : (
              combosFiltrados.map(c => {
                const seleccionado = c.id === value;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(c.id); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 hover:bg-amber-50 ${seleccionado ? 'bg-amber-100 font-medium' : ''}`}
                    >
                      <span className="truncate">
                        {c.nombre}
                        {suffixFor(c) && <span className="text-gray-500 ml-1">{suffixFor(c)}</span>}
                      </span>
                      {c.esOfertaSemanal && (
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Oferta
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
