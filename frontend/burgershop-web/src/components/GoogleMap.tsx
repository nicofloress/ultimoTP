import { useEffect, useRef } from 'react';
import type { Coordenadas } from '../hooks/useGooglePlaces';

interface GoogleMapProps {
  coordenadas: Coordenadas;
  className?: string;
  onClick?: (coords: Coordenadas, direccion: string) => void;
}

export function GoogleMap({ coordenadas, className = '', onClick }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

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
        gestureHandling: 'greedy',
      });

      geocoderRef.current = new google.maps.Geocoder();

      if (onClick) {
        mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          // Mover marcador
          if (markerRef.current) {
            markerRef.current.setPosition(e.latLng);
          } else {
            markerRef.current = new google.maps.Marker({
              position: e.latLng,
              map: mapInstanceRef.current,
            });
          }

          // Reverse geocoding
          geocoderRef.current?.geocode({ location: e.latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onClick({ lat, lng }, results[0].formatted_address);
            } else {
              onClick({ lat, lng }, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          });
        });
      }
    } else {
      mapInstanceRef.current.setCenter(coordenadas);
    }

    // Actualizar marcador
    if (markerRef.current) {
      markerRef.current.setPosition(coordenadas);
    } else if (mapInstanceRef.current) {
      markerRef.current = new google.maps.Marker({
        position: coordenadas,
        map: mapInstanceRef.current,
      });
    }
  }, [coordenadas]);

  return (
    <div ref={mapRef} className={`w-full rounded-lg ${className}`} style={{ minHeight: '180px' }} />
  );
}
