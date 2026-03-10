import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsScript } from '../../hooks/useGooglePlaces';
import { obtenerRepartidoresActivos, type UbicacionRepartidor } from '../../api/tracking';

const POLLING_INTERVAL = 10_000;
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos

// Centro por defecto (Buenos Aires)
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  if (diff < 0) return 'ahora';
  const seg = Math.floor(diff / 1000);
  if (seg < 60) return `hace ${seg}s`;
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min}min`;
  const hrs = Math.floor(min / 60);
  return `hace ${hrs}h`;
}

function esStale(fecha: string): boolean {
  return Date.now() - new Date(fecha).getTime() > STALE_THRESHOLD_MS;
}

function crearIconoMarcador(nombre: string, stale: boolean): string {
  const inicial = nombre.charAt(0).toUpperCase();
  const bg = stale ? '#9CA3AF' : '#F59E0B';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
      <circle cx="18" cy="18" r="16" fill="${bg}" stroke="white" stroke-width="2"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">${inicial}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

interface MarcadorState {
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
}

export default function TrackingMapaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const marcadoresRef = useRef<Map<number, MarcadorState>>(new Map());
  const [repartidores, setRepartidores] = useState<UbicacionRepartidor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sdkListo, setSdkListo] = useState(false);

  // Cargar SDK de Google Maps
  useEffect(() => {
    loadGoogleMapsScript().then(() => setSdkListo(true));
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!sdkListo || !mapRef.current || mapInstanceRef.current) return;
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    });
  }, [sdkListo]);

  // Polling de ubicaciones
  const fetchUbicaciones = useCallback(async () => {
    try {
      const data = await obtenerRepartidoresActivos();
      setRepartidores(data);
      setError(null);
    } catch {
      setError('Error al obtener ubicaciones');
    }
  }, []);

  useEffect(() => {
    fetchUbicaciones();
    const interval = setInterval(fetchUbicaciones, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUbicaciones]);

  // Actualizar marcadores
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sdkListo) return;

    const idsActuales = new Set(repartidores.map(r => r.repartidorId));

    // Remover marcadores que ya no estan
    marcadoresRef.current.forEach((state, id) => {
      if (!idsActuales.has(id)) {
        state.marker.setMap(null);
        state.infoWindow.close();
        marcadoresRef.current.delete(id);
      }
    });

    // Crear o actualizar marcadores
    repartidores.forEach((rep) => {
      const pos = { lat: rep.latitud, lng: rep.longitud };
      const stale = esStale(rep.fechaActualizacion);
      const iconUrl = crearIconoMarcador(rep.repartidorNombre, stale);
      const contenidoInfo = `
        <div style="padding:4px;min-width:150px">
          <strong style="font-size:14px">${rep.repartidorNombre}</strong>
          <div style="margin-top:4px;color:${stale ? '#EF4444' : '#6B7280'};font-size:12px">
            ${tiempoRelativo(rep.fechaActualizacion)}
            ${stale ? ' - Sin señal' : ''}
          </div>
        </div>`;

      const existente = marcadoresRef.current.get(rep.repartidorId);
      if (existente) {
        existente.marker.setPosition(pos);
        existente.marker.setIcon({
          url: iconUrl,
          scaledSize: new google.maps.Size(36, 36),
        });
        existente.infoWindow.setContent(contenidoInfo);
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          map,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(36, 36),
          },
          title: rep.repartidorNombre,
          animation: google.maps.Animation.DROP,
        });
        const infoWindow = new google.maps.InfoWindow({ content: contenidoInfo });
        marker.addListener('click', () => {
          // Cerrar todos los infowindows
          marcadoresRef.current.forEach(s => s.infoWindow.close());
          infoWindow.open(map, marker);
        });
        marcadoresRef.current.set(rep.repartidorId, { marker, infoWindow });
      }
    });
  }, [repartidores, sdkListo]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header con stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {repartidores.length} repartidor{repartidores.length !== 1 ? 'es' : ''} activo{repartidores.length !== 1 ? 's' : ''}
          </span>
          {repartidores.some(r => esStale(r.fechaActualizacion)) && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
              {repartidores.filter(r => esStale(r.fechaActualizacion)).length} sin señal
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Lista lateral de repartidores */}
      {repartidores.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {repartidores.map((rep) => {
            const stale = esStale(rep.fechaActualizacion);
            return (
              <button
                key={rep.repartidorId}
                onClick={() => {
                  mapInstanceRef.current?.panTo({ lat: rep.latitud, lng: rep.longitud });
                  mapInstanceRef.current?.setZoom(16);
                  const estado = marcadoresRef.current.get(rep.repartidorId);
                  if (estado) {
                    marcadoresRef.current.forEach(s => s.infoWindow.close());
                    estado.infoWindow.open(mapInstanceRef.current!, estado.marker);
                  }
                }}
                className={`text-left p-2 rounded-lg border text-sm transition-colors ${
                  stale
                    ? 'bg-gray-50 border-gray-200 text-gray-400'
                    : 'bg-white border-gray-200 hover:border-amber-400 text-gray-700'
                }`}
              >
                <div className="font-medium truncate">{rep.repartidorNombre}</div>
                <div className={`text-xs ${stale ? 'text-red-400' : 'text-gray-400'}`}>
                  {tiempoRelativo(rep.fechaActualizacion)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
