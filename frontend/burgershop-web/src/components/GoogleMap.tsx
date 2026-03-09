import { useEffect, useRef } from 'react';
import type { Coordenadas } from '../hooks/useGooglePlaces';

interface GoogleMapProps {
  coordenadas: Coordenadas;
  className?: string;
}

export function GoogleMap({ coordenadas, className = '' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: coordenadas,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative',
      });
    } else {
      mapInstanceRef.current.setCenter(coordenadas);
    }

    // Limpiar marcador anterior
    if (markerRef.current) {
      if ('setMap' in markerRef.current) {
        (markerRef.current as google.maps.Marker).setMap(null);
      }
    }

    markerRef.current = new google.maps.Marker({
      position: coordenadas,
      map: mapInstanceRef.current,
    });
  }, [coordenadas]);

  return (
    <div ref={mapRef} className={`w-full rounded-lg ${className}`} style={{ minHeight: '180px' }} />
  );
}
