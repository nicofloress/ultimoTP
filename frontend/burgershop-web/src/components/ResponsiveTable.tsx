import { ReactNode } from 'react';

/**
 * Wrapper genérico para tablas con overflow horizontal.
 * Mantiene el markup de tabla estándar pero agrega scroll horizontal en pantallas chicas
 * y un look consistente (fondo blanco, shadow, borde).
 *
 * Uso típico:
 * <ResponsiveTable>
 *   <thead>...</thead>
 *   <tbody>...</tbody>
 * </ResponsiveTable>
 */
interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  minWidth?: string; // e.g. "min-w-[600px]" para forzar scroll horizontal en pantallas muy chicas
}

export function ResponsiveTable({ children, className = '', minWidth = '' }: ResponsiveTableProps) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-x-auto ${className}`}>
      <table className={`w-full text-sm ${minWidth}`}>{children}</table>
    </div>
  );
}

/**
 * TH ordenable con icono de sort (desc/asc/none).
 * Uso:
 * <SortableHeader col="fecha" current={ordenCol} dir={ordenDir} onClick={toggleOrden}>Fecha</SortableHeader>
 */
interface SortableHeaderProps {
  col: string;
  current: string;
  dir: 'asc' | 'desc';
  onClick: (col: string) => void;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export function SortableHeader({ col, current, dir, onClick, children, align = 'left', className = '' }: SortableHeaderProps) {
  const isActive = current === col;
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      onClick={() => onClick(col)}
      className={`px-3 py-2 ${alignClass} text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none ${className}`}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        )}
      </span>
    </th>
  );
}
