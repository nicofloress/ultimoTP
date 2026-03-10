import { useState, useEffect, useRef, useCallback } from 'react';
import { enviarUbicacion, desactivarTracking } from '../api/tracking';

type GpsStatus = 'inactive' | 'active' | 'error' | 'denied';

interface UseGeoTrackingReturn {
  gpsStatus: GpsStatus;
  lastPosition: { lat: number; lng: number } | null;
}

const SEND_INTERVAL_MS = 10_000;

export function useGeoTracking(enabled: boolean): UseGeoTrackingReturn {
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('inactive');
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      // Wake Lock not available or denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendTimerRef.current !== null) {
      clearInterval(sendTimerRef.current);
      sendTimerRef.current = null;
    }
    releaseWakeLock();
    setGpsStatus('inactive');
  }, [releaseWakeLock]);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        stopTracking();
        desactivarTracking().catch(() => {});
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('active');
    requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        latestPositionRef.current = coords;
        setLastPosition(coords);
        setGpsStatus('active');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    // Send position to server every 10 seconds
    const sendPosition = () => {
      const pos = latestPositionRef.current;
      if (pos) {
        enviarUbicacion(pos.lat, pos.lng).catch(() => {});
      }
    };

    // Send immediately on start
    sendPosition();
    sendTimerRef.current = setInterval(sendPosition, SEND_INTERVAL_MS);

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTracking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, requestWakeLock, stopTracking]);

  return { gpsStatus, lastPosition };
}
