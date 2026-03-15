import { useCallback, useRef, useEffect, useState } from 'react';

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

export function loadGoogleMapsScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    scriptLoading = true;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY no configurada');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geocoding,directions`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

interface Sugerencia {
  descripcion: string;
  placeId: string;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export function useGooglePlaces() {
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (window.google?.maps?.places) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceRef.current = new (google.maps.places.AutocompleteService as any)();
      }
      if (window.google?.maps) {
        geocoderRef.current = new google.maps.Geocoder();
      }
    });
  }, []);

  const buscarDirecciones = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!input || input.length < 3) {
      setSugerencias([]);
      return;
    }

    setCargando(true);
    debounceRef.current = setTimeout(() => {
      if (!serviceRef.current) {
        setCargando(false);
        return;
      }

      serviceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'ar' },
          types: ['address'],
        },
        (predictions, status) => {
          setCargando(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSugerencias(
              predictions.map(p => ({
                descripcion: p.description,
                placeId: p.place_id,
              }))
            );
          } else {
            setSugerencias([]);
          }
        }
      );
    }, 300);
  }, []);

  const geocodificar = useCallback((placeId: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const loc = results[0].geometry.location;
        setCoordenadas({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setCoordenadas(null);
      }
    });
  }, []);

  const geocodificarDireccion = useCallback((address: string) => {
    if (!geocoderRef.current || !address) {
      setCoordenadas(null);
      return;
    }

    geocoderRef.current.geocode({ address, componentRestrictions: { country: 'ar' } }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const loc = results[0].geometry.location;
        setCoordenadas({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setCoordenadas(null);
      }
    });
  }, []);

  const limpiarSugerencias = useCallback(() => {
    setSugerencias([]);
  }, []);

  const limpiarCoordenadas = useCallback(() => {
    setCoordenadas(null);
  }, []);

  return {
    sugerencias, cargando, coordenadas,
    buscarDirecciones, limpiarSugerencias,
    geocodificar, geocodificarDireccion, limpiarCoordenadas,
  };
}
