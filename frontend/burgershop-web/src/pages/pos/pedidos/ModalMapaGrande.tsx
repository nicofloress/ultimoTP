import type { Coordenadas } from '../../../hooks/useGooglePlaces';
import { GoogleMap } from '../../../components/GoogleMap';

interface Props {
  coordenadas: Coordenadas | null;
  coordenadasLocal: { lat: number; lng: number } | null;
  direccion: string;
  setCoordenadas: (c: Coordenadas) => void;
  setDireccion: (d: string) => void;
  limpiarCoordenadas: () => void;
  onCerrar: () => void;
}

export default function ModalMapaGrande({
  coordenadas, coordenadasLocal, direccion,
  setCoordenadas, setDireccion, limpiarCoordenadas, onCerrar,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapa-grande-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-gray-200">
          <h3 id="mapa-grande-title" className="text-base sm:text-lg font-bold text-gray-800 flex-shrink-0">Seleccionar ubicacion</h3>
          {coordenadas && (
            <span className="text-xs sm:text-sm text-gray-500 truncate hidden sm:inline">{direccion || 'Ubicacion seleccionada'}</span>
          )}
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors flex-shrink-0" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 relative">
          <GoogleMap
            coordenadas={coordenadas || coordenadasLocal || { lat: -34.6037, lng: -58.3816 }}
            className="h-full"
            onClick={(coords, dir) => {
              setCoordenadas(coords);
              setDireccion(dir);
            }}
          />
          {!coordenadas && (
            <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
              <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">Hace click en el mapa para seleccionar ubicacion</span>
            </div>
          )}
        </div>
        {coordenadas && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-gray-700 truncate">
              <span className="font-medium">Direccion:</span> {direccion || '-'}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { limpiarCoordenadas(); setDireccion(''); }}
                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={onCerrar}
                className="px-3 py-1.5 text-sm text-white bg-amber-500 rounded-md hover:bg-amber-600 transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
