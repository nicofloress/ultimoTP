import { Repartidor } from '../../../types/logistica';
import { Venta } from '../../../types';

interface Props {
  pedido: Venta;
  repartidores: Repartidor[];
  onAsignar: (pedido: Venta, repartidorId: number) => void;
  onCerrar: () => void;
}

export default function ModalAsignarRepartidor({ pedido, repartidores, onAsignar, onCerrar }: Props) {
  const activos = repartidores.filter(r => r.activo);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asignar-repartidor-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 id="asignar-repartidor-title" className="text-base font-bold text-gray-800">Asignar Repartidor</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {activos.map(r => (
            <button
              key={r.id}
              onClick={() => onAsignar(pedido, r.id)}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-sm"
            >
              <div className="font-medium text-gray-800">{r.nombre}</div>
              {r.telefono && <div className="text-xs text-gray-500">{r.telefono}</div>}
              {r.vehiculo && <div className="text-xs text-gray-400">{r.vehiculo}</div>}
            </button>
          ))}
          {activos.length === 0 && (
            <p className="text-gray-400 text-center py-4 text-sm">No hay repartidores activos</p>
          )}
        </div>
      </div>
    </div>
  );
}
